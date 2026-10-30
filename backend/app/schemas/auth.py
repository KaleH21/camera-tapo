from pydantic import BaseModel, Field


class LoginInput(BaseModel):
    username: str
    password: str


class ViewerInput(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r'^[a-zA-Z0-9_-]+$')
    password: str = Field(min_length=12)

