import z from "zod";
import { tool } from "@langchain/core/tools";


export const createEventTool = tool(async() => {
    //Google calendar logic
    return "The meeting has been created";
}, 
{
    name : 'create-event',
    description : 'Call to create event in a calendar.',
    schema : z.object({})
})

export const getEventsTool = tool(async() => {
    //Google calendar logic
    return JSON.stringify([{ title : 'Meeting with Bob', date : '2024-01-15', location : 'Zoom' }]);
}, 
{
    name : 'get-events',
    description : 'Call to get events in a calendar.',
    schema : z.object({})
})
