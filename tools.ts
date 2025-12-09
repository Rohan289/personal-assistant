import z, { date, email, xid } from "zod";
import { tool } from "@langchain/core/tools";
import {google} from "googleapis";
import tokens from "./tokens.json";


const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
  oauth2Client.setCredentials({
    access_token : process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token : process.env.GOOGLE_REFRESH_TOKEN,
  });

const calendar = google.calendar({version: 'v3', auth : oauth2Client});
type EventParams = {
    q : string;
    timeMin : string;
    timeMax : string;
}

type CreateEventParams = {
    summary : string;
    start : {
        dateTime : string;
        timeZone : string;
    },
    end : {
        dateTime : string;
        timeZone : string;     
    },
    attendees : {email : string,displayName : string}[];

}

export const createEventTool = tool(async(params : CreateEventParams) => {
    console.log("Params received in createEventTool: ",params);
    const {summary,start,end,attendees} = params;
    //Google calendar logic
    const response = await calendar.events.insert({
        calendarId : 'rbhowmick184@gmail.com',
        sendUpdates : 'all',
        conferenceDataVersion : 1,
        requestBody : {
            start : start,
            end : end,
            summary : summary,
            attendees :attendees,
            conferenceData : {
                createRequest : {
                    requestId : `meet-${Date.now()}`,
                    conferenceSolutionKey : {
                        type : 'hangoutsMeet'
                }
                }
            }
        }
    });
    console.log("Response from create event: ",response.data);
    return "The meeting has been created";
}, 
{
    name : 'create-event',
    description : 'Call to create event in a calendar.',
    schema : z.object({summary : z.string().describe("The title of the event"),
        start : z.object({
            dateTime : z.string().describe("The start date and time of the event in ISO format"),
            timeZone : z.string().describe("The time zone of the start time")
        }),
        end : z.object({
            dateTime : z.string().describe("The end date and time of the event in ISO format"),
            timeZone : z.string().describe("The time zone of the end time")
        }),
        attendees : z.array(z.object({
            email : z.string().describe("The email of the attendee"),
            displayName : z.string().describe("The display name of the attendee")
        }))
    })

})

export const getEventsTool = tool(async(params : EventParams) => {
    //Google calendar logic
    /**
     * timeMin: new Date().toISOString(),
     * timeMax: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
     * q: 'meeting',
     * 
     */
    try{
        console.log("Params received in getEventsTool: ",params);
        const {q,timeMin,timeMax} = params;
        const result = await calendar.events.list({
            calendarId: 'rbhowmick184@gmail.com',
            timeMin:timeMin,
            timeMax:timeMax,
            q : ''
          });
        const response = result.data.items?.map(event => {
            return {
                id : event.id,
                summary : event.summary,
                status : event.status,
                organiser : event.organizer,
                start : event.start,
                end : event.end,
                attendees : event.attendees,
                meetingLink : event.hangoutLink,
                eventType : event.eventType
            }
        })
        return JSON.stringify(response);
    }
    catch(err) {
        console.log("Error fetching events: ",err);
    }
    return "Failed to connect to the calendar."
}, 
{
    name : 'get-events',
    description : 'Call to get events in a calendar.',
    schema : z.object({q : z.string().describe("The query to get events from google calendar.It can be one of these values : summary,description,location,attendees display name,attendees email,organizer display name,organiser's email,organiser's name"),
        timeMin : z.string().describe("The start time to get events from google calendar in UTC format"),
        timeMax : z.string().describe("The end time to get events from google calendar in UTC format")
    })
})


  