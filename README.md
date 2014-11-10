snooze
======

## STABLE VERSION COMING

August 10, 2014 Status Update

Thank you for using snooze/snooze-stdlib. Being the only one working on snooze right now in my free time I don't have a lot of time to work on snooze AND update the documentation. With all the changes and updates I'm adding to snooze it's currently in a very unstable state with no recent documentation. This will be fixed when snooze reaches v1.0 which could be in a few weeks to a few months.

Stay up to date on progress by following me on twitter:
https://twitter.com/micahwllmsn

And feel free to send me questions, comments, bug reports via email:
micahwllmsn@gmail.com

Thank you for your patience!

## Site

Restful API For NodeJS

Site with documenation now up!
http://snoozejs.org/

Snooze is a RESTful framework inspired by Angular. Why yet another framework? What's wrong with express? Snooze uses express. The reason for it is because after searching for a simple module framework to manage my restful api I couldn't find anything that I wanted to use. Snooze was developed by me, for me, to simplify the whole process. But I sure do hope other people will find it useful as well.

## snooze-cli MOVED!!

The snooze command line interfaced has moved to it's own project. snooze-cli should be installted globally

```
npm install snooze-cli -g
```

You may need to remove the old snooze bin first

```
rm -f /usr/local/bin/snooze
```

*Sorry for the inconvenience*

## Installation

```
npm install snooze --save
```

## Snooze Standard Library (recommended)

The Snooze Standard Library is a module that includes commonly used functionality for your project. See more at https://github.com/iamchairs/snooze-stdlib

## Basic Use

To get started require snooze and create a module.

```
var snooze = require('snooze');
snooze.module('myServer');
```

## Routes

```
snooze.module('myServer', ['snooze-stdlib'])
  .route('get', '/users/:username', {
    controller: 'UserCtrl',
    action: 'getUser'
  })
  .route('put', '/users/save', {
  	controller: 'UserCtrl',
  	action: 'save',
  	validators: 'BasicAuth'
  })
  .route('post', '/user/new', {
    controller: 'UserCtrl',
    action: 'new'
  })
  .setPort(80); // Defaults to 3000
```

Routes are defined as **.route(method, path, options)**. The possible methods are **GET**, **POST**, **PUT**, and **DELETE**.

#### Route Options

Options requires a controller and action for a route. The controllers will be explained next. The actions are methods (functions) in the controller that will handle the request and send the response.

Validators are optional and will be explained later.

## Controllers

Controllers are used to handle all http requests. Controllers can be defined in the following way-

```
snooze.module('myServer').controller('UserCtrl', function(User) {
  var _getUser = function(res, options) {
    res.send(200, {'username': options.params.username}); // params.username set by :username parameter in route. Ex: /users/iamchairs
  };

  var _save = function(res, options) {
  	User.save(options.body); // body is the payload of the PUT, POST, or DELETE request
  };

  var _new = function(res, options) {
    User.new(options.body); // body is the payload of the PUT, POST, or DELETE request
  };

  return {
    getUser: _getUser,
    save: _save,
    new: _new
  };
});
```

The methods defined in the controller handle processing and responding to http calls defined by route's action.

You can see **User** is being passed as a parameter and used in _save and _new. This is a service and is injected when the the module compiles it's services and controllers. More on services next.

Options is an object of all the useful information about the request. Currently this means parameters, url queries, and the body of the request.

**It is important to remember that controllers should be stateless. Only one UserCtrl controller is created for the entire application.**

## Services

Services are any kind of injectable and should be used to handle any thinking, querying, mapping, etc. A controller **CAN** but **SHOULDN'T** do all of the thinking, querying, and mapping of data but this defeats the purpose creating a modular architecture. A service can be defined like so-

```
snooze.module('myServer').service('Hello', function(AnotherService) {
  var _getGreeting = function() {
    return 'Hello Authorized World!';
  };

  return {
    getGreeting: _getGreeting
  };
});
```

Services can also be injected into other services. The Hello service will be able to use whatever *AnotherService* provides in it's return.

**It is important to remember that services should be stateless. Only one Hello service is created for the entire application.**

### Validators

Validators are very important in saving time and creating a readable application. It removes most of the redundant and simple checks from the logic of the controllers and services allowing you to focus on what the controllers and services are **actually** doing. Validators are defined similary to controllers and services and their names are provided to routes **validator** option as a string or an array of strings. To define a service you'l write-

```
snooze.module('myServer').validator('BasicAuth', function() {
  return function(deferred, req) {
    deferred.resolve()
  };
});
```

Validators return a function and **deferred** and **req** are provided to the function at runtime. The validator will not itself send a response but will either reject or resolve the defer. When rejection an array should be provided with the first index being the response code (200, 404, 500, etc.) and the second being a string as the message of the error. If no rejection response is provided a 500 error is sent with a message referencing the route that failed.

If your server includes a login a common validator you'l implement is a BasicAuth validator. An example can be seen here-

```
var snooze = require('snooze');

snooze.module('myServer').validator('BasicAuth', function(User) {
  return function(deferred, req) {
    setTimeout(function() {
      var header = req.headers['authorization'] || null;
      if(header !== null) {
        token = header.split(/\s+/).pop()||'';
        auth = new Buffer(token, 'base64').toString();
        parts = auth.split(/:/);

        username = parts[0];
        password = parts[1];

        User.validLogin(username, password).then(function() {
          deferred.resolve();
        }).fail(function() {
          deferred.reject([401, 'invalid loggin'])
        });
      } else {
        deferred.reject([401, 'user not logged in']);
      }
    }, 500);
  };
});

snooze.module('myServer').route('/messages/post', {
  controller: 'PostsCtrl',
  action: 'new',
  validators: 'BasicAuth'
});
```

When multiple validators are provided-

```
snooze.module('myServer').route('/post/delete/:thread_id', {
  controller: 'ThreadCtrl',
  ation: 'delete',
  validators: ['BasicAuth', 'ThreadOwner']
});
```

- All validators need to resolve before the request continues to the controller. If any validator rejects the request the tests will stop and the rejection response will send immediately.

### Starting the Server

Once all routes, controllers, services, and validators are defined you'l need to start the server manually.

```
snooze.module('myServer').wakeup();
```
> (loading information)

> Is it morning already?

> snooze started on port 8000

## Application Structure

This is up to you. I've begun organizing my application as such-

```
main.js
controllers\
  UserCtrl.js
routes\
  User.js
services\
  User.js
validators\
  BasicAuth.js
dto\
  UserDTO.js
```

And to make loading all requirements easier you can use the libs module method to load all files in a directory into your project.

```
snooze.module('myServer').libs(['controllers', 'routes', 'services', 'validators', 'dto']);
```

## DTOs

```
snooze.module('myModule').dto('ContactDTO', {
  id: {
    type: 'int',
    description: 'Id of the contact row',
    example: 1
  },
  user1: {
    type: 'int',
    description: 'Id of the first user',
    example: 1
  },
  user2: {
    type: 'int',
    description: 'Id of the second user',
    example: 2
  }
});
```

### Injecting DTOs

```
snooze.module('myModule').service('User', function(DB, ContactDTO, $q) {
  var _getContact = function(id) {
    // $q is a stdlib service
    var deferred = $q.defer();
    
    // DB doesn't exist as a service in the stdlib
    DB.query('SELECT * FROM contacts WHERE id=?', [id], function(err, rows) {
      deferred.resolve(ContactDTO.create(rows[0]));
    });
    
    return deferred.promise;
  };
  
  return {
    return getContact: _getContact
  };
});
```

### Nesting DTOs

```
snooze.module('myModule').dto('UserDTO', {
  id: {
    type: 'int',
    description: 'Id of the user.',
    example: 1
  },
  username: {
    type: 'string',
    description: 'Username of the user',
    example: 'iamchairs'
  },
  __methods: {
    fromDB: function() {
      return function(data) {
        return {
          id: data.user_id,
          username: data.user_username
        };
      };
    }
  }
});

snooze.module('myModule').dto('ContactDTO', {
  id: {
    type: 'int',
    description: 'Id of the contact row',
    example: 1
  },
  user1: {
    type: '@UserDTO',
    description: 'A UserDTO of the user.',
    example: '@UserDTO'
  },
  user2: {
    type: '@UserDTO',
    description: 'A UserDTO of the user.',
    example: '@UserDTO'
  },
  __methods: {
    fromDB: function(UserDTO) {
      return function(data) {
        return {
          id: data.contact_id,
          user1: UserDTO.fromDB(data),
          user2: UserDTO.fromDB(data)
        };
      };
    }
  }
});
```

## snooze Command Line Interface

A juvenile command line interface has begun that will help inspecting your snooze application. To use it make sure you've installed snooze globally.

```
npm install snooze -g
```
        
Navigate to your service application route directory and in the terminal type

```
snooze [module_name] help
```
        
for the list of avaialble commands. The snooze command line expects your server applications starting point to be main.js.

Site with documenation now up!
http://snoozejs.org/
