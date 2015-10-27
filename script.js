var Chat = {}; 

window.onload = function() 
{
	Chat.data = 
	{
		messages:   []
	};

	Chat.session = 
	{
		username:   "Anonymous",
		signin: function()
		{
			var that = this;
			var $username   = $(".signin-username");
			var $password    = $(".signin-password")
			var username      = $username.val(); 
			var password      = $password.val();

			if (!username) Chat.ui.showAlert("No username provided");
			else if (!password)  Chat.ui.showAlert("No password provided");
			else
			{
				$username.attr('disable','disable');
				$password.attr('disable','disable');
				$.post(Chat.config.api + "handler=auth", {username:username,password:password})
					.done(function(data)
					{
						$username.attr('disable',false);
						$password.attr('disable',false);

						if (!data["auth"] )
						{
							Chat.ui.showAlert("Invalid username and/or password");
						}
						else
						{
							$username.val("");
							$password.val("");
							that.username = username;
							Chat.ui.hideUsernameDialog();
							Chat.ui.showAlert("You successfully signed in as <u>" + username + "</u>")
							Chat.session.listUsers();
							Chat.getMessages(true);
						}
					})
					.fail(function()
					{
						Chat.ui.showAlert("Something happend. Try again.");
					})
			}
		},
		signup: function()
		{
			var that = this;
			var $username   = $(".signup-username");
			var $password    = $(".signup-password")
			var $confpassword    = $(".signup-confpassword")
			var username      = $username.val(); 
			var password      = $password.val();
			var confpassword      = $confpassword.val();
			
			if (!username) Chat.ui.showAlert("No username provided");
			else if (!password)  Chat.ui.showAlert("No password provided");
			else if (password != confpassword) Chat.ui.showAlert("Passwords do not match");
			else
			{
				$username.attr('disable','disable');
				$password.attr('disable','disable');
				$.post(Chat.config.api + "handler=createAccount", {username:username,password:password})
					.done(function(data)
					{
						$username.attr('disable',false);
						$password.attr('disable',false);
						$confpassword.attr('disable',false);

						if (!data["created"] )
						{
							Chat.ui.showAlert("Something happend during the creation of your account. Try again.");
						}
						else
						{
							$username.val("");
							$password.val("");
							$confpassword.val("");
							that.username = username;
							Chat.ui.hideUsernameDialog();
							Chat.ui.showAlert("You successfully signed in as <u>" + username + "</u>");
							Chat.session.listUsers();
							Chat.getMessages(true);
						}
					})
					.fail(function()
					{
						Chat.ui.showAlert("Something happend. Try again.");
					})
			}
		},
		listUsers: function()
		{
			var that = this;
			$.get(Chat.config.api + "handler=getUsers")
				.done(function(data)
				{
					var $list = $('#user-sidebar .users').eq(1);
					$list.html("");
					
					if (data["users"])
					{
						for(var index in data["users"])
						{
							$list.append($('<li data-sidebar-user="'+data["users"][index].username+'" class="user'+(that.username == data["users"][index]["username"] ? " me" : "")+'"><a href="javascript:Chat.ui.filterByUsername(\''+data["users"][index].username+'\')">'+data["users"][index].username+(that.username == data["users"][index]["username"] ? " (Me)" : "")+'</a></li>'));
						}
					}
				})
		}
	};

	Chat.config = 
	{
		api: 	        "it202/assignment4/ddt7.php?",
		timeout:        30000,
	}; 

	Chat.DOM = 
	{
		usernameDialog: "#username-modal",
		usernameSelected: "#username-selected",
		sendMessageBtn: "#send-btn",
		sendMessageField: "#message-field input",
		messagesHolderSelector: "#messages",
		messageSelector: "#messages > .message",
		getRenderedMessage: function(message)
		{
			return $("<div data-username='"+message.username+"' class='message"+(Chat.session.username == message.username ? " me" : "")+"'></div>")
				.append($("<div>"+(Chat.session.username == message.username ? "Me ("+message.username+")" : message.username)+"</div>"))
				.append($("<div><p>"+message.message+"</p></div>"))
				.append($("<div>"+message.date_sent+"</div>"))
		}
	};

	Chat.load = function()
	{
		if (this.isInitialized())
		{
			$(this.DOM.sendMessageField).on('keyup', function(e)
			{
				if (e.keyCode == 13)
				 { 
					Chat.sendMessage();
				}
			});

			$('div[data-username-view="signin"] input').on('keyup', function(e)
			{
				if (e.keyCode == 13)
				 { 
					Chat.session.signin();
				}
			});

			$('div[data-username-view="signup"] input').on('keyup', function(e)
			{
				if (e.keyCode == 13)
				 { 
					Chat.session.signup();
				}
			});
		}
	}; 

	Chat.isInitialized = function() 
	{

		return typeof $ === "function";
	}; 

	Chat.sendMessage = function() 
	{
		var that = this;
		var message = $(that.DOM.sendMessageField).val()

		if (!message) 
		{
			alert("Please provide a message before sending");
		}
		else if (that.isInitialized())
		{
			Chat.ui.clearField();

			$.post(that.config.api + "handler=sendMessage", {
					username: that.session.username,
					message: message
				})
				.done(function(data)
				{
					if (that.data.messages.length > 0)
					{
						//Chat.getMessages(true);
						Chat.ui.scrollToBottom();
						//Chat.getMessagesAfterId(that.data.messages[that.data.messages.length-1].id, true);
					}
				})
				.fail(function()
				{
				})
		}
		return that; 
	};

	Chat.getMessages = function(render) 
	{
		var that = this;
		if (that.isInitialized())
		{
			$.get(that.config.api + "handler=getMessages")
				.done(function(data)
				{	
					if  (data["messages"] instanceof Array)
					{
						that.data.messages = data["messages"]
						if (render) that.renderMessages();
						Chat.pollMessages();
						Chat.ui.scrollToBottom();
					}
				})
				.fail(function()
				{
				})
		}
		return that; 
	};

	Chat.pollMessages = function()
	{
		$.ajax({
			type:"GET",
			url:this.config.api + "handler=getMessagesAfterId&id=" + this.data.messages[this.data.messages.length-1].id,
			timeout: this.config.timeout
		})
		.done(function(data)
		{
			Chat.getMessages(true);
		})
		.fail(function()
		{
			Chat.pollMessages();
		})
	};


	Chat.getMessagesAfterId = function(id, render) 
	{
		var that = this;
		if (that.isInitialized())
		{
			$.get(that.config.api + "handler=getMessagesAfterId&id=" + id)
				.done(function(data)
				{	
					if  (data["messages"] instanceof Array)
					{
						that.data.messages = that.data.messages.concat(data["messages"])
						if (render) that.renderMessages();
						Chat.ui.scrollToBottom();
					}
				})
				.fail(function()
				{
				})
		}
		return that; 
	};

	Chat.renderMessages = function() 
	{
		var $messages = $(this.DOM.messagesHolderSelector); 
		if (this.isInitialized() && this.data.messages instanceof Array)
		{
			$messages.html(""); 
			for(var index in this.data.messages)
			{
				$messages.append(this.DOM.getRenderedMessage(this.data.messages[index]));
			}
		}
	};

	Chat.ui = 
	{
		filterByUsername: function(username)
		{
			$('li[data-sidebar-user]').removeClass('selected');
			$('li[data-sidebar-user="'+username+'"]').addClass('selected');

			if (username == "everyone")
			{
				$('.message').removeClass('hide');
			}
			else $('.message').not($('.message[data-username="'+username+'"]').removeClass('hide')).addClass('hide');
		},
		clearField: function()
		{
			$(Chat.DOM.sendMessageField).val("");
		}, 

		scrollToBottom: function()
		{
			$("html, body").stop().animate({ scrollTop: $(document).height() }, 300);
		},

		showUsernameDialog: function()
		{
			if (Chat.isInitialized())  
			{
				$('body').attr('class', 'blur');
				$('#username-modal').addClass('show');
			}
		},
		hideUsernameDialog: function()
		{
			if (Chat.isInitialized())
			{
				$('#username-modal').removeClass('show');
				$('body').attr('class', '');
			}
		},

		changeView: function(view)
		{	
			$('div[data-username-view]').removeClass('show');
			$('div[data-username-view="'+view+'"]').addClass('show');	
		},

		showAlert: function(message)
		{
			$('#alert p').html(message);
			$('#alert').addClass('show');
			setTimeout(this.hideAlert, 2000);
		},

		hideAlert: function()
		{
			$('#alert').removeClass('show');
		}
	}; 

	Chat.load();
	Chat.session.listUsers();
	Chat.ui.showUsernameDialog()

};







