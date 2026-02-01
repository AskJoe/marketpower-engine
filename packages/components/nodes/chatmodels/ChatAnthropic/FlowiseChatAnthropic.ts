import { AnthropicInput, ChatAnthropic as LangchainChatAnthropic } from '@langchain/anthropic'
import { type BaseChatModelParams } from '@langchain/core/language_models/chat_models'
import { IVisionChatModal, IMultiModalOption } from '../../../src'

const DEFAULT_IMAGE_MODEL = 'claude-3-5-haiku-latest'
const DEFAULT_IMAGE_MAX_TOKEN = 2048

export class ChatAnthropic extends LangchainChatAnthropic implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken: number
    multiModalOption: IMultiModalOption
    id: string

    constructor(id: string, fields?: Partial<AnthropicInput> & BaseChatModelParams) {
        // @ts-ignore
        super(fields ?? {})
        this.id = id
        this.configuredModel = fields?.modelName || ''
        this.configuredMaxToken = fields?.maxTokens ?? 2048
    }

    revertToOriginalModel(): void {
        this.modelName = this.configuredModel
        this.maxTokens = this.configuredMaxToken
    }

    setMultiModalOption(multiModalOption: IMultiModalOption): void {
        this.multiModalOption = multiModalOption
    }

    setVisionModel(): void {
        if (!this.modelName.startsWith('claude-3')) {
            this.modelName = DEFAULT_IMAGE_MODEL
            this.maxTokens = this.configuredMaxToken ? this.configuredMaxToken : DEFAULT_IMAGE_MAX_TOKEN
        }
    }

    /**
     * Override invocationParams to filter out LangChain's default sentinel values (-1)
     * for top_p and top_k. LangChain uses -1 as a sentinel to indicate "not set",
     * but if we don't filter these out, they get sent to Claude's API which rejects them.
     */
    invocationParams(options?: this['ParsedCallOptions']) {
        const params = super.invocationParams(options)

        // Remove top_p and top_k if they are -1 (LangChain's sentinel for "not set")
        if (params.top_p === -1) {
            delete params.top_p
        }
        if (params.top_k === -1) {
            delete params.top_k
        }

        return params
    }
}
