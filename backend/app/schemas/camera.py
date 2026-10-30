from pydantic import BaseModel, Field


class CameraInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    host: str
    port: int = Field(default=554, ge=1, le=65535)
    stream_path: str = Field(default='/stream1', pattern=r'^/stream[12]$')
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1)


class CameraPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    host: str | None = None
    port: int | None = Field(default=None, ge=1, le=65535)
    stream_path: str | None = Field(default=None, pattern=r'^/stream[12]$')
    username: str | None = Field(default=None, min_length=1, max_length=100)
    password: str | None = Field(default=None, min_length=1)
    enabled: bool | None = None
