from __future__ import annotations

import os

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
    Agent,
)
from livekit.plugins import openai

from prompts import WELCOME_MESSAGE, INSTRUCTIONS, LOOKUP_VIN_MESSAGE
from api import has_car, functions

# Load env variables
load_dotenv()
api_key = os.getenv("LIVEKIT_API_KEY")
api_secret = os.getenv("LIVEKIT_API_SECRET")
livekit_url = os.getenv("LIVEKIT_URL")
openai_api_key = os.getenv("OPENAI_API_KEY")


class MyAgent(Agent):
    def __init__(self, model: openai.realtime.RealtimeModel):
        super().__init__()
        self.model = model

    async def on_start(self, ctx: JobContext):
        # Send and speak a welcome message when the agent starts
        ctx.conversation.item.create(
            llm.ChatMessage(
                role="assistant",
                content=WELCOME_MESSAGE,
            )
        )
        ctx.response.create()  # 🔊 speak the welcome


async def entrypoint(ctx: JobContext):
    # Join the LiveKit room and wait for the browser participant
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    await ctx.wait_for_participant()

    # Realtime OpenAI model configured for audio + text
    model = openai.realtime.RealtimeModel(
        api_key=openai_api_key,
        instructions=INSTRUCTIONS,
        voice="shimmer",
        temperature=0.8,
        modalities=["audio", "text"],
        functions=functions,
    )

    # Instantiate and start your agent
    agent = MyAgent(model)
    await agent.start(ctx)

    # Handle committed user speech events
    @agent.session.on("user_speech_committed")
    def on_user_speech_committed(msg: llm.ChatMessage):
        print("user_speech_committed:", msg)  # debug log

        # Flatten mixed content (images + text) to plain text
        if isinstance(msg.content, list):
            msg.content = "\n".join(
                "[image]" if isinstance(x, llm.ChatImage) else x for x in msg
            )

        if has_car():
            handle_query(msg)
        else:
            find_profile(msg)

    def find_profile(msg: llm.ChatMessage):
        # Ask the model to look up the profile / VIN and speak it
        agent.session.conversation.item.create(
            llm.ChatMessage(
                role="system",
                content=LOOKUP_VIN_MESSAGE(msg),
            )
        )
        agent.session.response.create()  # 🔊 speak lookup prompt

    def handle_query(msg: llm.ChatMessage):
        # Forward user question to the model and speak the answer
        agent.session.conversation.item.create(
            llm.ChatMessage(
                role="user",
                content=msg.content,
            )
        )
        agent.session.response.create()  # 🔊 speak the answer


if __name__ == "__main__":
    options = WorkerOptions(
        entrypoint_fnc=entrypoint,
        api_key=api_key,
        api_secret=api_secret,
        ws_url=livekit_url,
    )
    cli.run_app(options)
