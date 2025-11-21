from fastapi import FastAPI, HTTPException, Header, Depends, Request
from pydantic import BaseModel, Field
from AI_model import load_model, get_prediction
from utility.database.main import get_session
from utility.database.model import User, APIKey, TextAnalysisRequest, UsageLog
from sqlmodel import Session, select, and_
from starlette.status import HTTP_403_FORBIDDEN, HTTP_500_INTERNAL_SERVER_ERROR
from datetime import datetime

app = FastAPI(
    servers=[
        {'url': 'http://127.0.0.1:8001', 'description': 'Local Server'}
    ],
    summary="A ",
    description="This API is used to classify text using a profanity detection model.",
    version="0.1.0",
    title="Profanity Detector API"
)

def authenticate_and_charge_credit(
        x_api_key: str = Header(..., description="Your unique API Key"),
        db: Session = Depends(get_session)
    ) -> User:

    if not x_api_key:
        raise HTTPException(
            status_code=401, # Unauthorized
            detail="API Key header is missing."
        )

    statement = select(User).where(
        User.apikeys.any(
            and_(
                APIKey.thekey == x_api_key,
            )
        )
    )
    user = db.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Invalid or inactive API Key."
        )

    if user.credits <= 0:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, # Forbidden
            detail="Insufficient credits. Please top up your account."
        )

    # Correctly decrement the credit count
    user.credits -= 1

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        # If the database commit fails, roll back and raise an internal server error
        db.rollback()
        print('error message',e)
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not process transaction: {e}"
        )

    # Return the user object on success
    return user

class Result(BaseModel):
    toxicity : float = Field(example=91.5475)
    severe_toxicity :float = Field(example= 0.0020)
    obscene : float = Field(example=0.0343)
    identity_attack : float = Field(example= 0.2414)
    insult : float = Field(example= 85.8501)
    threat : float = Field(example=0.0297)
    sexual_explicit : float = Field(example= 0.0141)
    average : float = Field(example=85.547)

class ResponseMessage(BaseModel):
    result : Result | dict
    success: bool = Field(description="Profane or not")

# 1) Update ResponseMessage schema — add credits_remaining & total_analyzed
# -------------------------
class ResponseMessage(BaseModel):
    result: Result | dict
    success: bool = Field(description="Profane or not")
    credits_remaining: int | None = Field(
        None, description="(NEW) Remaining credits for the authenticated user"
    )  # NEW
    total_analyzed: int | None = Field(
        None, description="(NEW) Total number of analyses this user has performed"
    )  # NEW

class TextInput(BaseModel):
    text: str = Field(..., description="The text to analyze",example="You are a badword!")

async def predict(text:str):
    try:
        # No await here, Detoxify.predict is synchronous
        prediction = get_prediction(text) # tet the prediction result of text using get_prediction method under detoxify_unbiased_small_model module
        result = {}
        total_score = 0.0
        num_categories = 0
        for category, value in prediction.items():
            score = float(value * 100)
            result[category] = score
            total_score += score
            num_categories += 1
        result["average"] = float(total_score / num_categories)
        return result
    except Exception as e:
        print(f"Error during prediction: {e}")
        return None
@app.on_event('startup')
def loading_model():
    global model
    print("Loading Detoxify 'unbiased' model at startup...")
    load_model()
    print("Model loaded successfully!")

@app.post(
    '/analyze',
    response_model=ResponseMessage,
    responses={
        500: {
            "description": "Internal Error",
            "content": {
                "application/json": {
                    "example": {
                        "result": {},
                        "success": False
                    }
                }
            }
        },
        400:{
            "description": "Api Not Found",
            "content": {
                "application/json": {
                    "example": {
                        "result": {},
                        "success": False
                    }
                }
            }
        },
        403:{
            "description": "FORBIDDEN",
            "content": {
                "application/json": {
                    "example": {
                        "detail":""
                    }
                }
            }
        }
    },
    tags=["AI"]
)
async def analyze(
        request: Request,
        text: TextInput,
        authenticated_user: User = Depends(authenticate_and_charge_credit),
        db: Session = Depends(get_session)
    ):

    print(f"Request successful for user {authenticated_user.id}. Credits remaining: {authenticated_user.credits}")

    result = await predict(text.text)

    if not text.text or not text.text.strip():
        raise HTTPException(
            status_code=400, # Bad Request
            detail="Input text cannot be empty."
        )

    if not result:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during model prediction.",
            headers={"X-Error": "Prediction failed"}
        )

    # Determine if the text is profane based on a threshold (e.g., average > 50)
    is_profane = result.get("average", 0) > 50

    # Create a new TextAnalysisRequest
    new_request = TextAnalysisRequest(
        inputtext=text.text ,
        isprofane=is_profane,
        toxicityscore=result.get("average"),
        userid=authenticated_user.id
    )

    # Create a new UsageLog
    new_log = UsageLog(
        statusCode=200,
        issuccessful=True,
        endpointurl=request.url.path,
        ipaddress=request.client.host,
        createdat=datetime.utcnow(),
        request=new_request,
        userid=authenticated_user.id
    )
    
    try:
        db.add(new_request)
        db.add(new_log)
        db.commit()
        db.refresh(new_request)
        db.refresh(new_log)
    except Exception as e:
        db.rollback()
        print('the error is here',e)
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save analysis or log: {e}"
        )




 # NEW: compute total number of analyses for this user (count rows)
    try:
        user_requests = db.exec(
            select(TextAnalysisRequest).where(TextAnalysisRequest.userid == authenticated_user.id)
        ).all()
        total_analyzed = len(user_requests)  # NEW
    except Exception as e:
        # if counting failed, fall back to None but don't break the response
        print("Could not compute total_analyzed:", e)
        total_analyzed = None

    # NEW: return credits_remaining and total_analyzed so frontend can update UI
    return {
        'result': Result(**result),
        'success': True,
        'credits_remaining': authenticated_user.credits,  # NEW
        'total_analyzed': total_analyzed                   # NEW
    }
