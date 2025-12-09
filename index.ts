
import { ChatGroq } from "@langchain/groq";
import { createEventTool, getEventsTool } from "./tools";
import { StateGraph,  MessagesAnnotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";

const tools = [createEventTool,getEventsTool];
const model = new ChatGroq({
    model : "openai/gpt-oss-120b",
    temperature : 0.7,
}).bindTools(tools);

async function callModel(state : typeof MessagesAnnotation.State) {
    const response = await model.invoke(state.messages);
    return {messages : [response]}
} 

const toolNode = new ToolNode(tools);

function shouldContinue(state : typeof MessagesAnnotation.State) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    if (lastMessage?.tool_calls?.length) {
        return "tools";
    }
    return "__end__";

}

const graph = new StateGraph(MessagesAnnotation).addNode('assistant',callModel).addNode('tools',toolNode).addEdge('__start__','assistant')
.addEdge('tools','assistant').addConditionalEdges('assistant',shouldContinue, {
    __end__ : END,
    tools : 'tools'
});

const app = graph.compile();

async function main() {
    const result = await app.invoke({
        messages : [
            // { role : 'user', content : 'Do I have any meeting today?' }
            {role : 'user',content : 'Can you create a meeting with Archi(senarchi4@gmail.com) at 7pm IST today about Design discussion?'}
        ]
    });
    console.log("AI : ",result.messages[result.messages.length -1]?.content);
}

main();