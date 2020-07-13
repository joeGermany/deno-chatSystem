// @ts-nocheck
let ws;
const chatUsersCtr = document.querySelector('#chatUsers');
const chatUsersCount = document.querySelector('#chatUsersCount');
const sendMessageForm = document.querySelector('#messageSendForm');
const messageInput = document.querySelector('#messageInput');
const chatMessagesCtr = document.querySelector('#chatMessages');
const leaveGroupBtn = document.querySelector('#leaveGroupBtn');
const groupName = document.querySelector('#groupName');

window.addEventListener('DOMContentLoaded', () => {
    ws = new WebSocket(`${window.location.protocol === 'http:' ? 'ws' : 'wss'}://${window.location.host}/ws`);
    ws.addEventListener('open', onConnectionOpen);
    ws.addEventListener('message', onMessageReceived);
});

sendMessageForm.onsubmit = (ev) => {
    ev.preventDefault();
    if (!messageInput.value) {
        return;
    }
    const event = {
        event: 'message',
        data: messageInput.value
    };
    ws.send(JSON.stringify(event));
    messageInput.value = ''; 
};

leaveGroupBtn.onclick = (ev) => {
    // const event = {
    //     event = 'leave'
    // };
    // ws.send(JSON.stringify(event));
    window.location.href = 'chat.html';
};

function onConnectionOpen() {
    console.log(`Connection Opened`);
    const queryParams = getQueryParams();
    if (!queryParams.name || !queryParams.group) {
        window.location.href = 'chat.html';
        return;
    }
    groupName.innerHTML = queryParams.group;
    const event = {
        event: 'join',
        groupName: queryParams.group,
        name: queryParams.name
    }
    ws.send(JSON.stringify(event));
}

function onMessageReceived(event) {
    console.log('Message received', event);
    event = JSON.parse(event.data);
    console.log(event);
    switch(event.event) {
        case 'users':
            chatUsersCount.innerHTML = event.data.length;
            chatUsersCtr.innerHTML = ''; 
            event.data.forEach(u => {
                const userEl = document.createElement('div');
                userEl.className = 'chat-user';
                userEl.innerHTML = u.name;
                chatUsersCtr.appendChild(userEl);
            });
            break;

        case 'message':
            const scrollToBottom = Math.floor(chatMessagesCtr.offsetHeight + chatMessagesCtr.scrollTop) 
                                    === chatMessagesCtr.scrollHeight;
            appendMessage(event.data);
            if (scrollToBottom) {
                chatMessagesCtr.scrollTop = chatMessagesCtr.scrollHeight;
            }
            break;

        case 'previousMessages':
            event.data.forEach(appendMessage);
            break;
    }
}

function appendMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${message.sender === 'me' ? 'to' : 'from'}`;
    messageEl.innerHTML = `
        ${message.sender === 'me' ? '' : `<h4>${message.name}</h4>`}
        <p class="message-text">${message.message}</p>
    `;
    chatMessagesCtr.appendChild(messageEl);
}

function getQueryParams() {
    const search = window.location.search.substring(1);
    const pairs = search.split('&');
    const params = {};
    for (const pair of pairs) {
        const parts = pair.split('=');
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }

    return params;
}