<?php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);

# Connect to DB
function connectdb() 
{ 
	$server 	= "sql.njit.edu";
	$username 	= "ddt7";
	$password 	= "BQTy8MPKY";
	$database 	= "ddt7"; 

	$link = mysql_connect($server, $username, $password);
	mysql_select_db($database);
	return $link;
}

# Disconnect DB
function disconnectdb($link) 
{

	mysql_close($link);
}

# Sends back response
function respond($data) 
{ 
	header("Content-Type: application/json");
	if (is_array($data) || is_object($data)) 
	{ 
		echo json_encode($data);
		exit;
	}
	else 
	{ 
		echo json_encode(['success' => true]);
		exit;
	}
}


# Get Messages
function api_getMessages() 
{
	# Parameters
	$params = $_REQUEST;

	$messages = [];
	$conn = connectdb();
	$result = mysql_query("SELECT * FROM it202_ChatMessages WHERE 1 ORDER BY date_sent ASC", $conn);  
	while($row = mysql_fetch_assoc($result))
	{
		$messages[] = $row;
	}
	disconnectdb($conn);
	respond(['messages' => $messages]);
}

# Create Account
function api_createAccount() 
{
	# Parameters
	$params = $_REQUEST;

	$username  = isset($params['username']) && is_string($params['username']) ? str_replace("'","\'",$params['username']) : ""; 
	$password   = isset($params['password']) && is_string($params['password']) ? str_replace("'","\'", $params['password']) : "";
	
	if ($username && $password) 
	{
		$conn           = connectdb();
		mysql_query("INSERT INTO it202_ChatAccount (username, password, date_created) VALUES ('$username','".MD5($password)."',NOW())", $conn); 
		disconnectdb($conn);
		return respond(['created' => true]);
	}
	else return respond(['created' => false]);
}


# Authenticate User
function api_auth()
{
	# Parameters
	$params = $_REQUEST;

	$username  = isset($params['username']) && is_string($params['username']) ? str_replace("'","\'",$params['username']) : ""; 
	$password  = isset($params['password']) && is_string($params['password']) ? str_replace("'","\'",$params['password']) : ""; 
	
	if ($username && $password)
	{
		$conn = connectdb();
		$result = mysql_query("SELECT COUNT(*) as authCount FROM it202_ChatAccount WHERE username = '".$username."' AND  password = '".MD5($password)."'");
		while($row = mysql_fetch_assoc($result))
		{
			if ($row['authCount'] == 1)
			{
				return respond(['auth' => true]);
			}
		}
		disconnectdb($conn);
	}

	return respond(['auth' => false]);
}

# Get Users
function api_getUsers() 
{
	# Parameters
	$params = $_REQUEST;

	$users = [];
	$conn = connectdb();
	$result = mysql_query("SELECT id, username FROM it202_ChatAccount WHERE 1", $conn);  
	while($row = mysql_fetch_assoc($result))
	{
		$users[] = $row;
	}
	disconnectdb($conn);
	respond(['users' => $users]);
}


# Check Username Availability
function api_checkUsername()
{
	# Parameters
	$params = $_REQUEST;

	$username  = isset($params['username']) && is_string($params['username']) ? str_replace("'","\'",$params['username']) : ""; 
	
	if ($username)
	{
		$conn = connectdb();
		$result = mysql_query("SELECT COUNT(*) as usernameCount FROM it202_ChatAccount WHERE username = '".$username."' ");
		while($row = mysql_fetch_assoc($result))
		{
			if ($row['usernameCount'] == 0)
			{
				return respond(['available' => true]);
			}
		}
		disconnectdb($conn);
	}

	return respond(['available' => false]);
}

# Get Messages
function api_getMessagesAfterId() 
{
	# Parameters
	$params = $_REQUEST;

	$id = isset($params['id']) && is_numeric($params['id']) ? $params['id'] : "";

	$messages = [];
	$conn = connectdb();
	
	// $iterations = 0; 
	$found = false;

	if ($id)
	{
		while(!$found)
		{
			$result = mysql_query("SELECT * FROM it202_ChatMessages WHERE id > '".$id."' ORDER BY date_sent  ASC", $conn);  
			while($row = mysql_fetch_assoc($result))
			{
				$messages[] = $row;
			}

			if (count($messages) > 0)
			{
				$found = true;
			}
			else sleep(0.5);

			// ++$iterations;

			// if ($iterations >= 500)
			// {
			// 	break;
			// }
		}
	}
	
	disconnectdb($conn);
	respond(['messages' => $messages]);
}

# Send Message
function api_sendMessage() 
{
	# Parameters
	$params = $_REQUEST;

	$username  = isset($params['username']) && is_string($params['username']) ? str_replace("'","\'",$params['username']) : "Anonymous"; 
	$message   = isset($params['message']) && is_string($params['message']) ? str_replace("'","\'", $params['message']) : "";
	$conn           = connectdb();
	mysql_query("INSERT INTO it202_ChatMessages (username, message, date_sent) VALUES ('$username','$message',NOW())", $conn); 
	disconnectdb($conn);
	respond(['sent' => true]);
}

# Gather Parameters
$params = $_REQUEST;

# Routes API Request
if (isset($params['handler']) && is_string($params['handler']) && function_exists("api_{$params['handler']}"))
{
	$handler = "api_{$params['handler']}";
	call_user_func($handler);
}
# If request is invalid send back error
else 
{
	respond(['error' => true]);
}

















