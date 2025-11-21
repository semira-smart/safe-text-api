from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid

# This is a dummy class to represent your UsageLog model for this example.
# You do not need to copy this part if you already have UsageLog in your project.
class UsageLogtoDict:
    def __init__(self, createdat: datetime, **kwargs):
        self.createdat = createdat
        # The rest of the attributes are not needed for this function
        self.id = kwargs.get('id', uuid.uuid4())
        self.issuccessful = kwargs.get('issuccessful', True)
        self.endpointurl = kwargs.get('endpointurl', '/analyze')
        self.ipaddress = kwargs.get('ipaddress', '127.0.0.1')
        self.requestid = kwargs.get('requestid')
        self.statuscode = kwargs.get('statuscode')
        self.userid = kwargs.get('userid')

def map_logs_to_weekly_chart_data(usage_logs: List[UsageLogtoDict]) -> Dict[str, Any]:
    """
    Analyzes a list of UsageLog objects and returns a dictionary
    with counts of logs for each day of the week.

    Args:
        usage_logs: A list of UsageLog objects, each with a 'createdat' attribute.

    Returns:
        A dictionary formatted for a chart, e.g.:
        {
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "values": [10, 5, 20, 15, 8, 12, 18]
        }
    """
    # 1. Define the labels for the days of the week.
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    # 2. Initialize a list to store the counts for each day, starting at zero.
    #    The index corresponds to the day (0 for Mon, 1 for Tue, etc.)
    day_counts = [0] * 7
    
    # 3. Iterate over each log in the input list.
    for log in usage_logs:
        # The .weekday() method returns an integer where Monday is 0 and Sunday is 6.
        day_index = log.createdat.weekday()
        
        # Increment the count for that specific day.
        day_counts[day_index] += 1
        
    # 4. Construct the final dictionary and return it.
    return {
        "labels": day_labels,
        "values": day_counts
    }

# --- Example Usage ---

# 1. Create some sample log data for demonstration.
#    (In your real code, you would get this list from your database).
