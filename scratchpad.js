

//Need to move global session Token into NewApiCall
    // this.fetchToken();


// OOP Notes:
// =============== 
// Create classes so any functions related to a certain part of our process in the app, bunch them together to an appropriate object and have the methods on that object available.
// Want to get away from all of our globals.  
// Find a place for it within one of our tobal level objects we'll create
// Any function in the global space should be placed within the context of one of the top level objects
// Expect to use a constructor for setting 1) default values or 2) values passed in when creating the object.

  //Does this need constructor properties? Or just group functions together?



// Remaining to Group:
// =============== 
// Group render functions together, render function can sit in object as well?
/* Group event listeners together ..?
  From Rich: I've seen solutions both ways. they need access to the store, the api, the renderer... so they do need to be passed those instantiations or live in one of the classes that has access to them.  our sample solution has the handlers in the renderer class  
  */

 // Need to move global store into newStore constructor.
