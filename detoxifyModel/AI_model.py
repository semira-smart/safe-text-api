from detoxify import Detoxify 
import torch

""" 
this module consist of core part of the system, detoxify unbiased-small model that predict toxic probalitiy of text.
we have used unbiased-small model with percision of float16 for better resource usage. 
"""
model = None

def load_model():
    global model
    model = Detoxify("unbiased-small") # load model
    model.model.to(torch.float16) # set precision float16 for fast computing and less resource usage.
    # load detoxify unbiased-small model and set percision of float16 for significant reduction of resource consumption
    model.model.eval() #set inference(prediction) mode, disables layers like dropout, which are only needed during training


def get_prediction(text):
    result = None
    if text:
        result = model.predict(text)
        return result
    else:
        return
if __name__ == "__main__":
    local_model = load_model()
    print("test:", get_prediction("you are stupid"))
