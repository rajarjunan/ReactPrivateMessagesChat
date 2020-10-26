import React, { Component } from 'react';
import SideBar from './SideBar'
import { COMMUNITY_CHAT, MESSAGE_SENT, MESSAGE_RECIEVED, TYPING, PRIVATE_MESSAGE } from '../../Events'
import ChatHeading from './ChatHeading'
import Messages from '../messages/Messages'
import MessageInput from '../messages/MessageInput'
import FileBase64 from 'react-file-base64';

export default class ChatContainer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			chats: [],
			activeChat: null,
			multiActiveChat: [],
			comment: '',
			postArray: [],
			postImage: [],
			postType: ''

		};
	}

	componentDidMount() {
		const { socket } = this.props
		this.initSocket(socket)
	}

	initSocket(socket) {
		socket.emit(COMMUNITY_CHAT, this.resetChat)
		// this.sendOpenPrivateMessage()
		socket.on(PRIVATE_MESSAGE, this.addChat)
		socket.on('connect', () => {
			socket.emit(COMMUNITY_CHAT, this.resetChat)
		})

		const { user } = this.props;
		socket.on("NEW USER", newUser => {
			if(newUser.name !== user.name) {
				this.sendOpenPrivateMessage(newUser.name)
			}
		  });

	}

	sendOpenPrivateMessage = (reciever) => {
		const { socket, user } = this.props
		socket.on("USER_CONNECTED", users => {
			console.log('connected_user:::', users);
		  });
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
		console.log(":::::addChat", chat);
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

	onChangePost = (event) => {
		const { target: { value } } = event;
		this.setState({ comment: value })
	}

	getTime = (date) => {
		return `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`
		// return date;
	}
	onSubmitPost = () => {
		let { comment, postArray } = this.state;
		let { user } = this.props;

		if (comment !== "") {
			let payload = {
				id: '_' + Math.random().toString(36).substr(2, 9),
				message: comment,
				postType: "message",
				subMessage: [],
				user,
				time: this.getTime(new Date(Date.now())),

			}
			let newArray = postArray.push(payload)
			this.setState(() => { postArray: newArray });
			this.setState({ comment: '' });
			// console.log("::::::::postArray", this.state.postArray);

		}

	}

	getFiles = (file) => {
		// console.log("::::::::::::::file", file);
		let { postArray } = this.state;
		let { user } = this.props;

		if (file[0].base64) {
			let payload = {
				id: '_' + Math.random().toString(36).substr(2, 9),
				message: (file[0].base64).replace(/"/g, "'"),
				postType: "image",
				subMessage: [],
				user,
				time: this.getTime(new Date(Date.now())),

			}
			let newArray = postArray.push(payload)
			this.setState(() => { postArray: newArray });
			// console.log("::::::::postArray", this.state.postArray);

		}
	}

	render() {
		const { user, logout } = this.props
		// console.log("::::::::::::user", user);
		const { chats, activeChat, multiActiveChat = [], postArray } = this.state
		// console.log("::::re:::", JSON.stringify(multiActiveChat));
		return (
			<div className="container">

				<div className="chat-room-container">
					<div className="comment-body-container">
						{
							(postArray || []).map((val) => {
								console.log("dispa:::::::::::::::::", val.message)
								return (<div><div className="parent-post-container">
									<div className="post-user-details"><div>{val.user.name}</div>&nbsp;&nbsp;<div>{val.time}</div></div>
									{((val.postType) === "image") ? <img src={this.state.message}></img> : <div className="parent-post-msg">{val.message}</div>}
								</div>
									<div className="post-msg-replay">
										Replay
						</div>
								</div>)
							})
						}
					</div>
					<div className="overall-chat-box">
						<div><input type="text" placeholder="Comments" value={this.state.comment} onChange={(e) => this.onChangePost(e)} id="comment" name="OverallComment" />
							<button type="button" onClick={() => this.onSubmitPost()} className="overall-post-btn">Post</button>
							<span className="overall-upload-btn"><img className="post-upload-img" src="https://img.icons8.com/cute-clipart/2x/upload.png" width="42px;">

							</img>
							
							</span>
						</div>
					</div>
					{
						<div className="chat-box-container">
							{(multiActiveChat || []).map((val, index) =>

								<div key={index} className="chat-room">
									<ChatHeading name={val.name} onCloseChatBox={() => this.onCloseChatBox(index)} />
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
					// onSendPrivateMessage={this.sendOpenPrivateMessage}
				/>
			</div>
		);
	}
}
