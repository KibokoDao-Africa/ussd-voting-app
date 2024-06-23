import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import africastalking from 'africastalking';

const UssdMenu = require('ussd-menu-builder');

// Initialize Africa's Talking
const africastalking = require('africastalking')({
    apiKey: 'YOUR_API_KEY',         // Replace with your API key
    username: 'YOUR_USERNAME'       // Replace with your Africa's Talking username
});

const app = express();
const menu = new UssdMenu();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface SessionData {
    language: string;
    name: string;
    id: string;
    phoneNumber: string;
    email: string;
}

const sessionStore: { [key: string]: SessionData } = {};

// Define menu states
menu.startState({
    run: () => {
        menu.con('Select Language:' +
            '\n1. English' +
            '\n2. Swahili');
    },
    next: {
        '1': 'enterName.en',
        '2': 'enterName.sw'
    }
});

menu.state('enterName.en', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], language: 'English' };
        menu.con('Enter your name:');
    },
    next: {
        '*[a-zA-Z]+': 'enterID.en'
    }
});

menu.state('enterName.sw', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], language: 'Swahili' };
        menu.con('Weka jina lako:');
    },
    next: {
        '*[a-zA-Z]+': 'enterID.sw'
    }
});

menu.state('enterID.en', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], name: menu.val };
        menu.con('Enter your ID:');
    },
    next: {
        '*\\d+': 'enterPhoneNumber.en'
    }
});

menu.state('enterID.sw', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], name: menu.val };
        menu.con('Weka kitambulisho chako:');
    },
    next: {
        '*\\d+': 'enterPhoneNumber.sw'
    }
});

menu.state('enterPhoneNumber.en', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], id: menu.val };
        menu.con('Enter your phone number:');
    },
    next: {
        '*\\d+': 'enterEmail.en'
    }
});

menu.state('enterPhoneNumber.sw', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], id: menu.val };
        menu.con('Weka nambari yako ya simu:');
    },
    next: {
        '*\\d+': 'enterEmail.sw'
    }
});

menu.state('enterEmail.en', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], phoneNumber: menu.val };
        menu.con('Enter your email:');
    },
    next: {
        '*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}': 'submitDetails.en'
    }
});

menu.state('enterEmail.sw', {
    run: () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], phoneNumber: menu.val };
        menu.con('Weka barua pepe yako:');
    },
    next: {
        '*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}': 'submitDetails.sw'
    }
});

menu.state('submitDetails.en', {
    run: async () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], email: menu.val };
        const sessionData: SessionData = sessionStore[sessionId];

        // Send session data to the createUserAPI
        await axios.post('https://example.com/api/createUser', sessionData);

        menu.con('Thank you for registering. Do you want to vote?' +
            '\n1. Yes' +
            '\n2. No');
    },
    next: {
        '1': 'vote.en',
        '2': 'end'
    }
});

menu.state('submitDetails.sw', {
    run: async () => {
        const { sessionId } = menu.args;
        sessionStore[sessionId] = { ...sessionStore[sessionId], email: menu.val };
        const sessionData: SessionData = sessionStore[sessionId];

        // Send session data to the createUserAPI
        await axios.post('https://example.com/api/createUser', sessionData);

        menu.con('Asante kwa kujisajili. Unataka kupiga kura?' +
            '\n1. Ndio' +
            '\n2. Hapana');
    },
    next: {
        '1': 'vote.sw',
        '2': 'end'
    }
});

menu.state('vote.en', {
    run: () => {
        // Placeholder for calling the voting API
        // Replace this with actual API call
        menu.end('Thank you for voting!');
    }
});

menu.state('vote.sw', {
    run: () => {
        // Placeholder for calling the voting API
        // Replace this with actual API call
        menu.end('Asante kwa kupiga kura!');
    }
});

menu.state('end', {
    run: () => {
        menu.end('Goodbye!');
    }
});

// Registering USSD handler with Express
app.post('/ussd', (req, res) => {
    menu.run(req.body, (ussdResult: any) => {
        res.send(ussdResult);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`USSD service running on port ${port}`);
});
