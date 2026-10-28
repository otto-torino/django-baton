from __future__ import annotations


class AIModels:
    BATON_GPT_3_5_TURBO = "gpt-3.5-turbo"
    BATON_GPT_4_TURBO = 'gpt-4-turbo'
    BATON_GPT_4O = 'gpt-4o'
    BATON_GPT_4O_MINI = 'gpt-4o-mini'
    BATON_GPT_5_4 = 'gpt-5.4'
    BATON_GPT_IMAGE_1_5 = 'gpt-image-1.5'

    # Retired by the provider: the Baton AI service no longer answers them,
    # and the configurations still asking for them get the replacement.
    retired_models: dict[str, str] = {
        BATON_GPT_3_5_TURBO: BATON_GPT_4O_MINI,
        BATON_GPT_4_TURBO: BATON_GPT_4O_MINI,
    }

    text_models: list[str] = [
        BATON_GPT_4O,
        BATON_GPT_4O_MINI,
        BATON_GPT_5_4,
    ]
    image_models: list[str] = [
        BATON_GPT_IMAGE_1_5,
    ]
    vision_models: list[str] = [
        BATON_GPT_4O_MINI,
        BATON_GPT_5_4,
    ]
    tag_suggestion_models = text_models
