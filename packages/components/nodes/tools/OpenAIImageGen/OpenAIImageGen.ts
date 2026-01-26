import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

class OpenAIImageGen_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'OpenAI Image Generation'
        this.name = 'openAIImageGen'
        this.version = 1.0
        this.type = 'OpenAIImageGen'
        this.icon = 'openai.svg'
        this.category = 'Tools'
        this.description = 'Generate images using OpenAI GPT-Image-1 / DALL-E API'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openAIApi']
        }
        this.inputs = [
            {
                label: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    {
                        label: 'gpt-image-1',
                        name: 'gpt-image-1',
                        description: 'Latest GPT Image model with best quality and instruction following'
                    },
                    {
                        label: 'dall-e-3',
                        name: 'dall-e-3',
                        description: 'DALL-E 3 - High quality image generation'
                    },
                    {
                        label: 'dall-e-2',
                        name: 'dall-e-2',
                        description: 'DALL-E 2 - Faster, lower cost'
                    }
                ],
                default: 'gpt-image-1'
            },
            {
                label: 'Image Size',
                name: 'size',
                type: 'options',
                options: [
                    { label: '1024x1024 (Square)', name: '1024x1024' },
                    { label: '1536x1024 (Landscape)', name: '1536x1024' },
                    { label: '1024x1536 (Portrait)', name: '1024x1536' },
                    { label: '512x512 (DALL-E 2 only)', name: '512x512' },
                    { label: '256x256 (DALL-E 2 only)', name: '256x256' }
                ],
                default: '1024x1024',
                optional: true
            },
            {
                label: 'Quality',
                name: 'quality',
                type: 'options',
                options: [
                    { label: 'Low (Fastest)', name: 'low' },
                    { label: 'Medium', name: 'medium' },
                    { label: 'High (Best quality)', name: 'high' },
                    { label: 'Standard (DALL-E 3)', name: 'standard' },
                    { label: 'HD (DALL-E 3)', name: 'hd' }
                ],
                default: 'medium',
                optional: true
            },
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                default: 'generate_image',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Tool Description',
                name: 'toolDescription',
                type: 'string',
                default: 'Generate an image based on a text description. Use this when the user asks to create, draw, or generate an image.',
                rows: 3,
                optional: true,
                additionalParams: true
            }
        ]
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(DynamicStructuredTool)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const model = nodeData.inputs?.model as string
        const size = nodeData.inputs?.size as string
        const quality = nodeData.inputs?.quality as string
        const toolName = (nodeData.inputs?.toolName as string) || 'generate_image'
        const toolDescription = (nodeData.inputs?.toolDescription as string) ||
            'Generate an image based on a text description. Use this when the user asks to create, draw, or generate an image.'

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const openAIApiKey = getCredentialParam('openAIApiKey', credentialData, nodeData)

        if (!openAIApiKey) {
            throw new Error('OpenAI API Key is required')
        }

        const tool = new DynamicStructuredTool({
            name: toolName,
            description: toolDescription,
            schema: z.object({
                prompt: z.string().describe('Detailed text description of the image to generate')
            }),
            func: async (input: { prompt: string }) => {
                const { prompt } = input
                try {
                    const response = await fetch('https://api.openai.com/v1/images/generations', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openAIApiKey}`
                        },
                        body: JSON.stringify({
                            model: model || 'gpt-image-1',
                            prompt: prompt,
                            n: 1,
                            size: size || '1024x1024',
                            quality: quality || 'medium'
                        })
                    })

                    const result = await response.json()

                    if (result.error) {
                        return `Error generating image: ${result.error.message}`
                    }

                    if (result.data && result.data[0]) {
                        const imageUrl = result.data[0].url
                        return `Image generated successfully! View it here: ${imageUrl}`
                    }

                    return 'Failed to generate image: No image data returned'
                } catch (error: any) {
                    return `Error generating image: ${error.message}`
                }
            }
        })

        return tool
    }
}

module.exports = { nodeClass: OpenAIImageGen_Tools }
