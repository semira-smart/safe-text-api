from flask import Flask, render_template,redirect, request,url_for,flash,jsonify
from .utility.database.main import get_session # .utility "." in order to find utility module inside fullstack folder
from .utility.database.model import User,Admin,APIKey,UsageLog,TextAnalysisRequest
from flask import session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlmodel import SQLModel, Session, select, func, delete
from sqlalchemy import and_
from functools import wraps
import secrets  
from .utility.mapper import map_logs_to_weekly_chart_data
# Set the secret key to some random bytes. Keep this really secret!

app = Flask(__name__,)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

# Add this to app.py, near the login_required decorator

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("role") != "admin":
            flash("You do not have permission to access this page.", "error")
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user_id is stored in session
        if 'user_id' not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('user_login'))
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def home():
    return render_template('User/landing-page.html')


# Replace the existing admindashboard function in app.py with this
# Add 'func' to your sqlmodel import: from sqlmodel import SQLModel, Session, select, func

@app.route('/admindashboard')
@admin_required
def admindashboard():
    db = get_session()
    try:
        # Fetch aggregate statistics for the dashboard cards
        stats = {
            "total_users": db.exec(select(func.count(User.id))).one(),
            "api_requests": db.exec(select(func.count(TextAnalysisRequest.id))).one(),
            "toxic_blocked": db.exec(select(func.count(TextAnalysisRequest.id)).where(TextAnalysisRequest.isprofane == True)).one(),
            "active_api_keys": db.exec(select(func.count(APIKey.id)).where(APIKey.isactive == True)).one()
        }

        # Fetch all user records to display in the "Manage Users" table
        all_users = db.exec(select(User)).all()
        
        # Prepare user data for easy rendering in the template
        users_data = []
        for user in all_users:
            api_requests_count = len(user.text_analysis_requests)
            users_data.append({
                "email": user.email,
                "status": getattr(user, 'status', 'approved'),
                "credits": user.credits,
                "api_requests": api_requests_count,
                "joined": user.createdat.strftime("%Y-%m-%d")
            })

        return render_template('Admin/admin-dashboard.html', stats=stats, users=users_data)

    except Exception as e:
        # Log the error and show an error message to the admin
        print(f"--- ADMIN DASHBOARD ERROR ---: {e}")
        flash("An error occurred while loading the dashboard data.", "error")
        # Render the page with empty data to avoid a crash
        return render_template('Admin/admin-dashboard.html', stats={}, users=[])

@app.route('/api/generate-key', methods=['POST'])
@login_required
def generate_api_key():
    """
    Securely generates a new API key for the logged-in user.
    """
    # Get the user ID from the session first
    user_id = session.get("user_id")
    if not user_id:
        # This case should ideally be caught by @login_required, but it's good practice
        return jsonify({'error': 'Authentication error: No user ID in session'}), 401

    try:
        
        db = get_session()
        # Generate a secure key
        new_key_string = f"safe_{secrets.token_hex(24)}"
        
        # Create the new APIKey instance, linking it to the user
        new_key = APIKey(userid=user_id, thekey=new_key_string)
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        return jsonify({
            "success": True,
            "api_key": new_key_string,
            "message": "Key generated successfully"})

    except Exception as e:        
        # Print the actual exception to your console for debugging
        print(f"--- DATABASE ERROR ---: {e}") 
        
        return jsonify({'error': 'An internal error occurred. Could not generate key.'}), 500
    
    
@app.route('/api/delete-key', methods=['DELETE'])
@login_required
def delete_api_key():
    """
    Handles API key deletion with proper authentication and validation
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or 'key' not in data:
        return jsonify({"success": False, "error": "Missing key parameter"}), 400

    key_to_delete = data['key']
    db = get_session()
    
    try:
        # Verify the key belongs to the current user before deleting
        key_exists = db.exec(
            select(APIKey).where(
                and_(
                    APIKey.userid == user_id,
                    APIKey.thekey == key_to_delete
                )
            )
        ).first()

        if not key_exists:
            return jsonify({"success": False, "error": "Key not found or access denied"}), 404

        # Delete the key
        db.exec(
            delete(APIKey).where(
                and_(
                    APIKey.userid == user_id,
                    APIKey.thekey == key_to_delete
                )
            )
        )
        db.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        db.rollback()
        print(f"--- DELETE KEY ERROR ---: {e}")
        return jsonify({"success": False, "error": "Database error"}), 500
    


@app.route('/user/dashboard')
@login_required
def user_dashboard():
    """
    This function securely handles the user dashboard with robust error handling.
    1. It ensures the user is logged in.
    2. It fetches user data inside a try/except block to handle session errors.
    3. It provides dynamic data to the HTML template.
    """
    current_user = session.get("email")
    user_id = session.get("user_id")

    if not current_user or not user_id:
        session.clear()
        flash("Your session has expired or the user was not found. Please log in again.", "error")
        return redirect(url_for('user_login'))

    user_keys = []
    credit = 0  # Default value
    db = get_session()
    try:
        # These queries will fail if the session is in a PendingRollbackError state
        user_keys = db.exec(select(APIKey.thekey).where(APIKey.userid == user_id)).all()
        # .first() returns a tuple, so we access the first element
        credit_result = db.exec(select(User.credits).where(User.id == user_id)).first()
        usage = db.exec(select(UsageLog).where(UsageLog.userid == user_id)).all()
        textanalyzed = db.exec(select(TextAnalysisRequest).where(TextAnalysisRequest.userid ==user_id)).all()
        chart_data = map_logs_to_weekly_chart_data(usage_logs=usage)
        print(map_logs_to_weekly_chart_data(usage_logs=usage))
        print(textanalyzed)
        if credit_result:
            credit = credit_result

    except Exception as e:
        # If any database error occurs, roll back the session to clean it up
        db.rollback()
        print(f"--- DASHBOARD DATABASE ERROR ---: {e}")
        flash("A database error occurred while loading your dashboard. Please try again.", "error")
        # Redirecting to login can help reset the state cleanly
        return redirect(url_for('user_login'))
        
    # Dummy data for demonstration
    dashboard_data = {
        "chart_data": map_logs_to_weekly_chart_data(usage_logs=usage)
    }

    return render_template(
        'User/user-dashboard.html',
        user=current_user,
        data=dashboard_data,
        keys=user_keys,
        credit=credit,
        totalanalysis = len(textanalyzed),
        chart_data=chart_data
    )


@app.route("/user/signup", methods=["GET", "POST"])
def user_signup():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        if not email or not password:
            flash("Email and password are required.", "warning")
            return redirect(url_for("user_signup"))

        db = get_session()
        if db.exec(select(User).where(User.email == email)).first():
            flash("An account with this email already exists.", "warning")
            return redirect(url_for("user_signup"))

        new_user = User(email=email, password_hash=generate_password_hash(password))
        db.add(new_user)
        db.commit()

        flash("Signup successful! Please log in.", "success")
        return redirect(url_for("user_login"))

    return render_template("user/user-registration.html")


@app.route("/user/login", methods=["GET", "POST"])
def user_login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        db = get_session()
        user = db.exec(select(User).where(User.email == email)).first()

        if user and check_password_hash(user.password_hash, password):
            session.clear()
            session["user_id"] = user.id
            session["email"] = user.email
            session["role"] = "user"
            return redirect(url_for("user_dashboard"))

         # ❌ Show flash if login fails
        flash("Invalid email or password. please try again", "error")
    return render_template("user/user-login.html")


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        db = get_session()
        admin = db.exec(select(Admin).where(Admin.email == email)).first()

        if admin and admin.password_hash == password:
            session.clear()
            session["user_id"] = admin.id
            session["email"] = admin.email
            session['role'] = 'admin'
            return redirect(url_for("admindashboard"))

        # ❌ Show flash if login fails
        flash("Invalid email or password. pls try again", "error")
    return render_template("admin/admin-login.html")

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been successfully logged out.", "success")
    return redirect(url_for('user_login'))

def check_session():
    if 'userId' in session:
        return True
    return False

if __name__ == '__main__':

    app.run(debug=True)
