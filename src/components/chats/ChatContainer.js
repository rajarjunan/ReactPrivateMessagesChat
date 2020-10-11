import React, { Component } from 'react';
import SideBar from './SideBar'
import { COMMUNITY_CHAT, MESSAGE_SENT, MESSAGE_RECIEVED, TYPING, PRIVATE_MESSAGE } from '../../Events'
import ChatHeading from './ChatHeading'
import Messages from '../messages/Messages'
import MessageInput from '../messages/MessageInput'

export default class ChatContainer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			chats: [],
			activeChat: null,
			multiActiveChat: []

		};
	}

	componentDidMount() {
		const { socket } = this.props
		this.initSocket(socket)
	}

	initSocket(socket) {
		socket.emit(COMMUNITY_CHAT, this.resetChat)
		socket.on(PRIVATE_MESSAGE, this.addChat)
		socket.on('connect', () => {
			socket.emit(COMMUNITY_CHAT, this.resetChat)
		})
	}

	sendOpenPrivateMessage = (reciever) => {
		const { socket, user } = this.props
		socket.emit(PRIVATE_MESSAGE, { reciever, sender: user.name })
	}

	/*
	*	Reset the chat back to only the chat passed in.
	* 	@param chat {Chat}
	*/
	resetChat = (chat) => {
		return this.addChat(chat, true)
	}

	/*
	*	Adds chat to the chat container, if reset is true removes all chats
	*	and sets that chat to the main chat.
	*	Sets the message and typing socket events for the chat.
	*	
	*	@param chat {Chat} the chat to be added.
	*	@param reset {boolean} if true will set the chat as the only chat.
	*/
	addChat = (chat, reset = false) => {
		const { socket } = this.props
		const { chats } = this.state

		const newChats = reset ? [chat] : [...chats, chat]
		this.setState({ chats: newChats, activeChat: reset ? chat : this.state.activeChat })

		const messageEvent = `${MESSAGE_RECIEVED}-${chat.id}`
		const typingEvent = `${TYPING}-${chat.id}`

		socket.on(typingEvent, this.updateTypingInChat(chat.id))
		socket.on(messageEvent, this.addMessageToChat(chat.id))
	}

	/*
	* 	Returns a function that will 
	*	adds message to chat with the chatId passed in. 
	*
	* 	@param chatId {number}
	*/
	addMessageToChat = (chatId) => {
		return message => {
			const { chats } = this.state
			let newChats = chats.map((chat) => {
				if (chat.id === chatId)
					chat.messages.push(message)
				return chat
			})

			this.setState({ chats: newChats })
		}
	}

	/*
	*	Updates the typing of chat with id passed in.
	*	@param chatId {number}
	*/
	updateTypingInChat = (chatId) => {
		return ({ isTyping, user }) => {
			if (user !== this.props.user.name) {

				const { chats } = this.state

				let newChats = chats.map((chat) => {
					if (chat.id === chatId) {
						if (isTyping && !chat.typingUsers.includes(user)) {
							chat.typingUsers.push(user)
						} else if (!isTyping && chat.typingUsers.includes(user)) {
							chat.typingUsers = chat.typingUsers.filter(u => u !== user)
						}
					}
					return chat
				})
				this.setState({ chats: newChats })
			}
		}
	}

	/*
	*	Adds a message to the specified chat
	*	@param chatId {number}  The id of the chat to be added to.
	*	@param message {string} The message to be added to the chat.
	*/
	sendMessage = (chatId, message) => {
		const { socket } = this.props
		socket.emit(MESSAGE_SENT, { chatId, message })
	}

	/*
	*	Sends typing status to server.
	*	chatId {number} the id of the chat being typed in.
	*	typing {boolean} If the user is typing still or not.
	*/
	sendTyping = (chatId, isTyping) => {
		const { socket } = this.props
		socket.emit(TYPING, { chatId, isTyping })
	}

	setActiveChat = (activeChat) => {
		this.setState({ activeChat });
		let { multiActiveChat } = this.state;
		let boolVal = true;
		multiActiveChat.map(val => {
			if (val.name === activeChat.name) {
				boolVal = false;
			}
		});
		if (boolVal) {
			let newArrayVal = multiActiveChat.unshift(activeChat)
			this.setState(() => { multiActiveChat: newArrayVal });
		}

	}

	onCloseChatBox = (index) => {
		let { multiActiveChat } = this.state;
		multiActiveChat.splice(index, 1);
		this.setState(() => { multiActiveChat });
	}


	render() {
		const { user, logout } = this.props
		const { chats, activeChat, multiActiveChat = [] } = this.state
		console.log("::::re:::", JSON.stringify(multiActiveChat));
		return (
			<div className="container">

				<div className="chat-room-container">
					<h1>Hello World</h1>
					<h1>Hello World</h1>

					<h1>Hello World</h1>
					<h1>Hello World</h1>
					<h1>Hello World</h1>
					<h1>Hello World</h1>
					
					{
						<div className="chat-box-container">
							{(multiActiveChat || []).map((val, index) =>

								<div key={index} className="chat-room">
									<ChatHeading name={val.name} onCloseChatBox={() =>this.onCloseChatBox(index)} />
									<Messages
										messages={val.messages}
										user={user}
										typingUsers={val.typingUsers}
									/>
									<MessageInput
										sendMessage={
											(message) => {
												this.sendMessage(val.id, message)
											}
										}
										sendTyping={
											(isTyping) => {
												this.sendTyping(val.id, isTyping)
											}
										}
									/>

								</div>

							)}
						</div>
					}
				</div>
				<SideBar
					logout={logout}
					chats={chats}
					user={user}
					activeChat={activeChat}
					setActiveChat={this.setActiveChat}
					onSendPrivateMessage={this.sendOpenPrivateMessage}
				/>
			</div>
		);
	}
}
