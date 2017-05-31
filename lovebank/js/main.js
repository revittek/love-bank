var dbShell;

function doLog(s){
    /*
    setTimeout(function(){
        console.log(s);
    }, 3000);
    */
}

function dbErrorHandler(err){
    alert("DB Error: "+err.message + "\nCode="+err.code);
}

function phoneReady(){
    doLog("phoneReady");
    //First, open our db
    
    dbShell = window.openDatabase("SimpleNotes", 2, "SimpleNotes", 1000000);
    doLog("db was opened");
    //run transaction to create initial tables
    dbShell.transaction(setupTable,dbErrorHandler,getEntries);
    doLog("ran setup");
}

//I just create our initial table - all one of em
function setupTable(tx){
    doLog("before execute sql...");
    tx.executeSql("CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY,title,body,updated)");
    doLog("after execute sql...");
}   

//I handle getting entries from the db
function getEntries() {
    
    //doLog("get entries");
    dbShell.transaction(function(tx) {
        tx.executeSql("select id, title, body, updated from notes order by updated desc",[],renderEntries,dbErrorHandler);
    }, dbErrorHandler);
}

    
function renderEntries(tx,results){
    doLog("render entries");
    if (results.rows.length == 0) {
        $("#mainContent").html("<p>You currently do not have any notes.</p>");
    } else {
       var s = "";
       for(var i=0; i<results.rows.length; i++) {
         s += "<li><a href='edit.html?id="+results.rows.item(i).id + "'>" + results.rows.item(i).title + "</a></li>";   
       }
       $("#noteTitleList").html(s);
       $("#noteTitleList").listview("refresh");
    }
}

function saveNote(note, cb) {
    //Sometimes you may want to jot down something quickly....
    if(note.title == "") note.title = "[No Title]";
    dbShell.transaction(function(tx) {
        if(note.id == "") tx.executeSql("insert into notes(title,body,updated) values(?,?,?)",[note.title,note.body, new Date()]);
        else tx.executeSql("update notes set title=?, body=?, updated=? where id=?",[note.title,note.body, new Date(), note.id]);
    }, dbErrorHandler,cb);
}

function init(){
    document.addEventListener("deviceready", phoneReady, false);
    
    //handle form submission of a new/old note
    $("#editNoteForm").live("submit",function(e) {
        var data = {title:$("#noteTitle").val(), 
                    body:$("#noteBody").val(),
                    id:$("#noteId").val()
        };
        saveNote(data,function() {
            $.mobile.changePage("index.html",{reverse:true});
        });
        e.preventDefault();
    });

    //will run after initial show - handles regetting the list
    $("#homePage").live("pageshow", function() {
        getEntries(); 
    });

    //edit page logic needs to know to get old record (possible)
    $("#editPage").live("pageshow", function() {
        //get the location - it is a hash - got to be a better way
        var loc = window.location.hash;
        if(loc.indexOf("?") >= 0) {
            var qs = loc.substr(loc.indexOf("?")+1,loc.length);
            var noteId = qs.split("=")[1];
            //load the values
            $("#editFormSubmitButton").attr("disabled","disabled"); 
            dbShell.transaction(
                function(tx) {
                    tx.executeSql("select id,title,body from notes where id=?",[noteId],function(tx,results) {
                        $("#noteId").val(results.rows.item(0).id);
                        $("#noteTitle").val(results.rows.item(0).title);
                        $("#noteBody").val(results.rows.item(0).body);
                        $("#editFormSubmitButton").removeAttr("disabled");   
                    });
                }, dbErrorHandler);
            
        } else {
         $("#editFormSubmitButton").removeAttr("disabled");   
        }
    });
}