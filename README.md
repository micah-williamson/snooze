# Snooze 1.0.0-alpha.1
## Differences to pre-alpha snooze
Pretty much everything has been reworked here. Snooze is no longer opinionated on how it should be used and does not focus on creating a RESTful server (though it can still be used to). It has removed most of what was in the pre-alpha version to create a better foundation for a more powerful and modular framework. Mostly this is done in the way of Entities. **More information provided in the README below**.
## Installation
    # install snooze to your local project
    npm install snooze
    
    # install snooze-baselib as a starting place for your project
    npm install snooze-baselib
    
    # optionally install snooze-cli to start
    # your projects using a snooze.json config file
    sudo npm install -g snooze-cli
## Setup
To create a simple one-file snooze application an example is shown below. More advanced setups later in the README. It is recommended that beginners, intermediates, and advanced users use the `snooze-baselib` module unless there are specific reasons not to. The `snooze-baselib` module contains usefule `Entities` and `importProcesses`.

    // main.js
    (function() {
        'use strict';
        
        // Snooze is a global object. Because of node's require caching
        // the snooze object has one instance accross all files.
        var snooze = require('snooze');
        
        // Creates a myApp module and imports the `snooze-baselib` module
        snooze.module('myApp', ['snooze-baselib'])
            // Creates a run function that will be ran when the application starts
            .run(function() {
                console.log('Hello World!');
            })
            // Does some compiling and begins the app by calling all config
            // and run processes.
            .wakeup();
    })();
Outputs

    # running via terminal
    node main.js
    Hello World!
    
#### Modules
Modules are a flexible wrapper or foundation for your project. They can be designed to share a set of functionality to other modules (and are not intended to run alone), or they can be designed to run your application. Modules greatest strength is that it allows sharing functionality easily and in an abstrated, modular way. To create a module use the `snooze.module` method.

    var snooze = require('snooze');
    snooze.module('myApp', []);
    
When creating a module the second param is required. It can be an empty array or an array of modules to import. All module methods that don't return a value returns itself making commands chainable.

    snooze.module('myApp', []).doSomething().doSomethingElse();
    
If the modules is already created you can access it be omitting the array.

    snooze.module('myApp').doSomething();
    
#### Importing Modules
Importing modules lets you import functionality into your application seemlessly. Modules can be written yourself or downloaded using npm. `snooze-baselib` is a highly recommended starting point. Using it as an example, to install it and import it into your project do the following.

```
 npm install snooze-baselib --save
```
```
snooze.module('myApp', ['snooze-baselib']);
```

If the npm module hasn't been required using `require()` snooze will try to do this automatically. If you are trying to import a local module (not from npm) `require()` it manually before you try to import it into another module.

**Note** When a module is constructed the dependant modules will import immediately.

#### run
A run processes may be what you use to run your app. Your module can define multiple run processes that will get called once `wakeup` or `doRuns` is called. It's recommended you should use `wakeup` instead. Run processes allow injected Entities.

    angular.module('myApp').run(function(MyService) {
        MyService.doSomething();
    });
    
#### config
Config processes are called before run processes. Entities may define a config object. This is up to the writer of the entity to provide as well as document.

    angular.module('myApp').config(function(MyService) {
        MyService.maxSomethings = 10;
    }).run(function(MyService) {
        MyService.doSomething();
    });
    
Depending on how the Entity is written. Some entities may provide a config and an injectable, just a config, or just an injectable. See the documentation of the Entity for it's possible uses.

#### wakeup
Because I am a pun-master (i'm not), to start your *snooze* application you should *wakeup*. This will go through the `configPreprocessors`, `config` processes, and `run` processes in that order.

    snooze.module('myApp')
        .run(function() {
            console.log('foo');
        });
    
    console.log('bar');
    
    snooze.module('myApp').wakeup();
Outputs

    bar
    foo

#### Entities
A Service in pre-alpha is what is now a *type* of Entity in alpha. An Entity can be created and customized to serve any purpose. Using the **recommended** `snooze-baselib` module in your projects you get the `service`, `value`, and `constant` entities in your project. Other entities can be imported from other modules or created by the developer and shared through imports.

An Entity can be injected into snooze processes or any "injectable function". They can also be injected into Entities that define a function for their `constructor`. Taking the `service` Entity from `snooze-baselib` we can create a Math service for our application.

    // lib/services/Math.js
    (function() {
        'use strict';
        var snooze = require('snooze');
        
        // Constructing a service named Math. The second parameter is the constructor.
        // This function can also contain injectable Entities like services.
        snooze.module('myApp').service('Math', function() {
            return {
                sum: function(num1, num2) {
                    return num1, num2;
                }
            };
        })
        .run(function(Math) {
            console.log(Math.sum(10, 5));
        });
    });
Outputs

    node main.js
    15
**Note** we don't include the dependencies here. When dependencies are defined, snooze will construct a module. When no dependencies are defined you are accessing the module.

Entities come in different shapes and sizes. Lets create a bank app that prevents you from withdrawing more that $500 at a time.

// lib/services/Bank.js
    (function() {
        'use strict';
        var snooze = require('snooze');
        
        snooze.module('myApp').service('Bank', function(maxWithdrawAmount) {
            return {
                withdraw: function(accountBalance, withdrawAmount) {
                    if(withdrawAmount > maxWithdrawAmount) {
                        console.log('Unable to withdraw $' + withdrawAmount + ' as it exceeds the max withdraw amount of $' + maxWithdrawAmount);
                        
                        return accountBalance;
                    } else {
                        return accountBalance - withdrawAmount;
                    }
                }
            };
        })
        .constant('maxWithdrawAmount', 500)
        .run(function(Bank) {
            var myBalance = 1000;
            myBalance = Bank.withdraw(myBalance, 700);
            myBalance = Bank.withdraw(myBalance, 200);
            
            console.log('$' + myBalance);
        });
    });
Output

    node main.js
    Unable to withdraw $700 as it exceeds the max withdraw amount of $500
    $800
    
For more information on `service`, `value`, and `constant`, see the [snooze-baselib README](https://github.com/iamchairs/snooze-baselib).

#### Registering Entities
Each module is responsible for importing it's own entities. You don't need to worry about importing the entities from a module you are importing. The module you are importing (say `snooze-baselib`) will import it's Entity types (`service`, `value`, and `constant`) as well as entities built on these types (like in our `Math` example). To create your own entities on these types and import them use the `registerEntitiesFromPath` method. You can specify the exact path of the file to import or use a [globbing pattern](https://github.com/isaacs/node-glob).

    // main.js
    (function() {
        'use strict';
        var snooze = require('snooze');
        
        snooze.module('myApp', ['snooze-baselib'])
            .registerEntitiesFromPath('lib/services/Math.js')
            // .registerEntitiesFromPath('lib/services/*.js') [all js files in lib/services]
            // .registerEntitiesFromPath('lib/**/*.js') [all js files in lib recursively]
            .run(function(Math) {
                console.log(Math.sum(10, 5));
            })
            .wakeup();
    })();

#### snooze.json (config)

If the root of your app has a snooze.json file in it, snooze will load the contents into the config when it's constructed. Modules can be written to read the config and change the behavior of your application in the configuration or running phases of your application. **In vanilla snooze no configurable properties are available**. So I will use `snooze-baselib`'s extension of config as an example.

    {
    	"mode": "development",
    	"modes": {
    		"production": { /* production config */ },
    		"development": { /* development config */ },
    		"testing": { /* testing config */ },
    		"foobar": { /* foobar config */ }
    	}
    }

By importing `snooze-baselib` into your module a few more properties become available in your config. Notably allowing you to define modes of configuration. For more on this see the `snooze-baselib` README.

## Advanced Modifications
In this section I'll go into creating custom Entities, Config Preprocessors, and Import Processes, and extending snooze.json.

Before you do this consider the following.
* Is this functionality available elsewhere?
* If this functionality exists but doesn't provide exactly what I need should I try contacting the author first?
* How can this affect other modules?
 * Is it modular enough?
 * Is it abstracted?
 * Am I modifying basic functionality accross the app in a potentially harmful way?
   * Did I document this well enough?

In several ways you can change the way snooze and modules work entirely through these features. This flexibility is powerful but can also be harmful. Be careful, be nice.

#### Creating Entities
`Entities` is a loose term for the type of Entity as well as instances of that type. An Entity type is refered to as an `EntityGroup`. And instance of an `EntityGroup` is an `Entity`. An `Entity` also creates and instance of itself when it's injected. So we have `EntityGroup`, `Entity`, and `EntityInstance`. Using `snooze-baselib` again as an example, a `service` is an `EntityGroup`. If we create a `service` called Math, Math is an `Entity`. When Math is injected (in say, a run processes) it injects an instance of Math called an `EntityInstance`.

##### EntityGroups

To create the `service` `EntityGroup` we will do the following.

    // lib/entities/service.js
    (function() {
    	'use strict';
    
    	var snooze = require('snooze');
    
    	var Service = new snooze.EntityGroup();
    	Service.type = 'service';
    
    	module.exports = Service;
    })();

The name, or type, of the Entity should set to the new `EntityGroup` object constructed from `snooze.EntityGroup`. The type should not contain spaces. The reason for this is because when this `EntityGroup` is compiled it's type will become a method on the module.

Before `EntityGroup`

    snooze.module('myApp')
        .service('MyService', function() {}); // Error: undefined is not a function
After `EntityGroup`

    snooze.module('myApp')
        .registerEntityGroupsFromPath('lib/entities/*.js')
        .service('MyService', function() {}); // All good
        
##### Compiling

The `EntityGroup` has a set of methods that take an `Entity` and apply it's config, injection, etc. An `Entity` is constructed in 2 parts. The first being the name of the `Entity`, the second being the `constructor`. The `constructor` in the above examples is the function, but this can be any value you defined as the constructor. In the `snooze-baselib` `constant` `Entity` the constructor is not a function but just whatever value is passed in the second argument **as is**. In any case, we need to create a `compile` method that takes the `constructor` and constructs an instance.

    Service.compile = function(entity, entityManager) {
		entity.instance = entityManager.run(entity.constructor);

		if(entity.instance.$compile) {
			entity.instance.$compile();
		}
	};
	
The service `compile` takes the `constructor` and runs it as an injectable function using `EntityManager`. The returned value is the `EntityInstance`. Additionally, if the newly created instance has a $compile method it will run that after compiling the instance.

##### Registering Dependencies

Once the instance has been compiled we should write the `registerDependencies` method. Not all Entities will have dependencies and the ones that do may not use an injectable function as it's `constructor`. Because of this, it's up to the author of the `Entity` to create a method that will register the Entities dependencies. This step is important, it will prevent circular dependencies and infinite loops.

    Service.registerDependencies = function(entity, entityManager) {
		if(typeof entity.constructor === 'function') {
			entity.dependencies = snooze.Util.getParams(entity.constructor);
		} else {
			throw Error('Services expect function constructors. ' + (typeof entity.constructor) + ' given');
		}
	};
	
##### Injecting

The `EntityGroup` should define what an Entity provides when it's being injected. In the case of a `service` we will return the instance unless $get is defined (in which case that will be returned).

    Service.getInject = function(entity, entityManager) {
		if(entity.instance.$get) {
			return entity.instance.$get;
		}

		return entity.instance;
	};
**Using $get**

    snooze.module('myApp')
        .service('MyService1', function() {
            // Here is the injected value
            return {
                foo: function() {
                    return 'bar';
                }
            };
        })
        .service('MyService2', function() {
            var properties = {
                fooValue: 'bar'
            };
            return {
                properties: properties
                // Here is the injected value
                '$get': {
                    foo: function() {
                        return properties.fooValue
                    }
                }
            };
        })
        .run(function(MyService1, MyService2) {
            console.log(MyService1.foo());
            console.log(MyService2.foo());
        });
Outputs

    bar
    bar
    
##### Configuring

Similar to the `getInject` method but used when injecting into `module.config` processes.
    
    Service.getConfig = function(entity, entityManager) {
		if(entity.instance.$config) {
			return entity.instance.$config;
		}

		return entity.instance;
	};
	
Using to update $get.

    snooze.module('myApp')
        .service('MyService1', function() {
            // Here is the injected value
            return {
                foo: function() {
                    return 'bar';
                }
            };
        })
        .service('MyService2', function() {
            var properties = {
                fooValue: 'bar'
            };
            return {
                properties: properties
                // Here is the injected value
                '$get': {
                    foo: function() {
                        return properties.fooValue
                    }
                }
            };
        })
        .config(function(MyService2) {
            MyService2.properties.fooValue = 'baz';
        })
        .run(function(MyService1, MyService2) {
            console.log(MyService1.foo());
            console.log(MyService2.foo());
        });
Outputs
    
    bar
    baz
    
##### Other Properties

**private** - You can set an `Entity` as private. This means it will not be shared to an importing module. (default: false)

**injectable** - You can set any individual `Entity` as injectable or not. If false, the `Entity` cannot be injected into other Entities or run processes. (default: true)

**configurable** - You can set any individual `Entity` as configurable or not. If false, the `Entity` cannot be injected into config processes. (default: true)

```
    Service.compile = function(entity, entityManager) {
		entity.instance = entityManager.run(entity.constructor);

		entity.private = entity.$private || entity.private;
		entity.injectable = entity.$injectable || entity.injectable;
		entity.configurable = entity.$configurable || entity.configurable;

		if(entity.instance.$compile) {
			entity.instance.$compile();
		}
	};
```

```
    // This service is only configurable
    snooze.module('myApp')
        .service('routeManager', function() {
            return {
                $injectable: false,
                path: function(url, cb) { ... }
            };
        })
        .config(function(routeManager) {
            routeManager.path('/users', function() { ... });
        });
```

#### Import Processes
#### Config Preprocessors
#### Using snooze.json