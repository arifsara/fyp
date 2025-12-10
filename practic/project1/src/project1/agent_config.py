# agent_logic.py

from agents import Agent, Runner, function_tool, set_default_openai_key
from dataclasses import dataclass
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()
#openai_key = os.environ.get("OPENAI_API_KEY")
api_model = "gpt-4o-mini"
set_default_openai_key(os.environ.get("OPENAI_API_KEY"))

@dataclass
class context:
    liking = "mountains"
    disliking = "beach"

class output_type(BaseModel):
    destination: str
    days: int
    budget: int
    activities: list[str]
    weather: str
    restaurants: list[str]
    hotel: str
    estimated_cost: int

def dynamic_instruction(context, agent_name: str) -> str:
    if agent_name == "Weather Agent":
        return "You are a helpful assistant that can help me find the weather in a city."
    elif agent_name == "Activities Agent":
        return "You help plan activities based on likes/dislikes and duration."
    elif agent_name == "Restaurants Agent":
        return "You suggest great restaurants in a city."
    elif agent_name == "Hotel Agent":
        return "You recommend and book a hotel in a city."
    else:
        return "You are a travel planner. Coordinate sub-agents and return the complete plan."

@function_tool
def get_weather(context, city: str) -> str:
    return f"The weather in {city} is pleasant"

@function_tool
def get_activities(context, city: str) -> str:
    return f"hiking, swimming, and fishing"

@function_tool
def get_restaurants(context, city: str) -> str:
    return f"The Grill, The Steakhouse, The Italian Restaurant"

@function_tool
def get_hotel(context, city: str) -> str:
    return f"The Grand Hotel"

@function_tool
def get_estimated_cost(context, days: int) -> str:
    return str(days * 3000)

# Define the agents
main_agent = Agent[context](
    name="Main Agent",
    instructions =dynamic_instruction,
    model = api_model,
    tools = [get_weather, get_activities, get_restaurants, get_hotel, get_estimated_cost],
    output_type = output_type,
)

def run_trip_agent(user_query: str) -> output_type:
    result = Runner.run_sync(main_agent, user_query)
    return result.final_output
