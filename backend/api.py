from livekit.agents import llm
import enum
from typing import Annotated
import logging
from db_driver import DatabaseDriver

logger = logging.getLogger("user-data")
logger.setLevel(logging.INFO)

DB = DatabaseDriver()

class CarDetails(enum.Enum):
    VIN = "vin"
    Make = "make"
    Model = "model"
    Year = "year"

# Global state for car details
_car_details = {
    CarDetails.VIN: "",
    CarDetails.Make: "",
    CarDetails.Model: "",
    CarDetails.Year: ""
}

def get_car_str():
    car_str = ""
    for key, value in _car_details.items():
        car_str += f"{key}: {value}\n"
    return car_str

# Implementation functions (your DB logic)
def _lookup_car_impl(vin: str):
    logger.info("lookup car - vin: %s", vin)
    result = DB.get_car_by_vin(vin)
    if result is None:
        return "Car not found"
    
    global _car_details
    _car_details = {
        CarDetails.VIN: result.vin,
        CarDetails.Make: result.make,
        CarDetails.Model: result.model,
        CarDetails.Year: result.year
    }
    
    return f"The car details are: {get_car_str()}"

def _get_car_details_impl():
    logger.info("get car details")
    return f"The car details are: {get_car_str()}"

def _create_car_impl(vin: str, make: str, model: str, year: int):
    logger.info("create car - vin: %s, make: %s, model: %s, year: %s", vin, make, model, year)
    result = DB.create_car(vin, make, model, year)
    if result is None:
        return "Failed to create car"
    
    global _car_details
    _car_details = {
        CarDetails.VIN: result.vin,
        CarDetails.Make: result.make,
        CarDetails.Model: result.model,
        CarDetails.Year: result.year
    }
    
    return "Car created!"

def has_car():
    return _car_details[CarDetails.VIN] != ""

# Define functions as dicts (for RealtimeModel)
functions = [
    {
        "name": "lookup_car",
        "description": "Lookup a car by its VIN",
        "parameters": {
            "type": "object",
            "properties": {
                "vin": {
                    "type": "string",
                    "description": "The VIN of the car to lookup"
                }
            },
            "required": ["vin"]
        },
        "callable": _lookup_car_impl  # Link to implementation
    },
    {
        "name": "get_car_details",
        "description": "Get the details of the current car",
        "parameters": {
            "type": "object",
            "properties": {}
        },
        "callable": _get_car_details_impl
    },
    {
        "name": "create_car",
        "description": "Create a new car",
        "parameters": {
            "type": "object",
            "properties": {
                "vin": {
                    "type": "string",
                    "description": "The VIN of the car"
                },
                "make": {
                    "type": "string",
                    "description": "The make of the car"
                },
                "model": {
                    "type": "string",
                    "description": "The model of the car"
                },
                "year": {
                    "type": "integer",
                    "description": "The year of the car"
                }
            },
            "required": ["vin", "make", "model", "year"]
        },
        "callable": _create_car_impl
    }
]
