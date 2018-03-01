var GAME_DURATION=60;
var model={
    gameHasStarted:false,
    secondsRemaining:GAME_DURATION,
    allowedLetters:[],
    currentAttempt:"",
    wordSubmissions:[]
};
function startGame(){
    endGame();
    model.gameHasStarted=true;
    model.secondsRemaining=GAME_DURATION;
    model.allowedLetters=generateAllowedLetters();
    model.wordSubmissions=[];
    model.currentAttempt="";
    model.timer=startTimer()
}
function endGame(){
    stopTimer()
}
function addNewWordSubmission(word){
    var alreadyUsed=model.wordSubmissions.filter(function(submission){
        return submission.word==word}).length>0;
        if(containsOnlyAllowedLetters(word)&&alreadyUsed==false){
            model.wordSubmissions.push({word:word});checkIfWordIsReal(word)}
        }
        
function checkIfWordIsReal(word){
    $.ajax({
        url:"http://api.pearson.com/v2/dictionaries/lasde/entries?headword="+word,
        success:function(response){
            console.log("We received a response from Pearson!");
            console.log(response);
            var theAnswer=response.results.length>0;
            model.wordSubmissions.forEach(function(submission){
                if(submission.word===word){
                    submission.isRealWord=theAnswer
                }
            });
            render()},
            error:function(err){
                console.log(err)}
            })}
$(document).ready(function(){
    $("#new-game-button").click(function(){
        startGame();render()
    });
    $("#textbox").on("input",function(){
        model.currentAttempt=$("#textbox").val();
        render()
    });
    $("#word-attempt-form").submit(function(evt){
        evt.preventDefault();
        addNewWordSubmission(model.currentAttempt);
        model.currentAttempt="";
        render()
    });
    render()
});
function render(){
    $("#current-score").text(currentScore());
    
    $("#time-remaining").text(model.secondsRemaining);

    if(model.gameHasStarted==false){
        $("#game").hide();
        return;
    }
    $("#allowed-letters").empty();
    $("#textbox").removeClass("bad-attempt").attr("disabled",false);
    $("#word-submissions").empty();
    $(".disallowed-letter").remove();
    $("#game").show();
    var letterChips=model.allowedLetters.map(letterChip);
    $("#allowed-letters").append(letterChips);
    $("#word-submissions").append(model.wordSubmissions.map(wordSubmissionChip));
    $("#textbox").val(model.currentAttempt).focus();
    var disallowedLetters=disallowedLettersInWord(model.currentAttempt);
    if(disallowedLetters.length>0){
        $("#textbox").addClass("bad-attempt");
        var redLetterChips=disallowedLetters.map(disallowedLetterChip);
        $("#word-attempt-form").append(redLetterChips)
    }
    var gameOver=model.secondsRemaining<=0;
    if(gameOver){
        $("#textbox").attr("disabled",true).val("")
    }
}
function letterChip(letter){
    var letterChip=$("<span></span>")
    .text(letter)
    .attr("class","tag tag-lg allowed-letter");
    var scoreChip=$("<span></span>")
    .text(letterScore(letter))
    .attr("class","tag tag-default tag-sm");
    return letterChip.append(scoreChip)
}
function wordSubmissionChip(wordSubmission){
    var wordChip=$("<span></span>")
    .text(wordSubmission.word)
    .attr("class","tag tag-lg word-submission");
    if(wordSubmission.hasOwnProperty("isRealWord")){
        var scoreChip=$("<span></span>");
        scoreChip.text(wordSubmission.isRealWord?wordScore(wordSubmission.word):"X");
        scoreChip.attr("class","tag tag-sm").addClass(wordSubmission.isRealWord?"tag-primary":"tag-danger");
        wordChip.append(scoreChip)
    }
    return wordChip
}
function disallowedLetterChip(letter){
    return $("<span></span>")
    .text(letter)
    .addClass("tag tag-sm tag-danger disallowed-letter")
}
var scrabblePointsForEachLetter={
    a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,
    n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10
};

function isDisallowedLetter(letter){
    return model.allowedLetters.indexOf(letter)==-1
}
function disallowedLettersInWord(word){
    letters=word.split("");
    return letters.filter(isDisallowedLetter)
}
function containsOnlyAllowedLetters(word){
    return disallowedLettersInWord(word).length==0
}

function generateAllowedLetters(){
    return chooseN(7,Object.keys(scrabblePointsForEachLetter))
}

function letterScore(letter){
    return scrabblePointsForEachLetter[letter.toLowerCase()]
}

function wordScore(word){
    var letters=word.split("");
    var letterScores=letters.map(letterScore);
    return letterScores.reduce(add,0)
}

function currentScore(){
    var wordScores=model.wordSubmissions.map(function(submission){
        if(submission.isRealWord){
            return wordScore(submission.word)
        }else{
            return 0
        }
    });
    return wordScores.reduce(add,0)
}
function chooseN(n,items){
    var selectedItems=[];
    var total=Math.min(n,items.length);
    for(var i=0;i<total;i+=1){
        index=Math.floor(Math.random()*items.length);
        selectedItems.push(items[index]);
        items.splice(index,1)
    }
    return selectedItems
}
function add(a,b){
    return a+b
}
function startTimer(){
    function tick(){
        return setTimeout(function(){
            model.secondsRemaining=Math.max(0,model.secondsRemaining-1);
            render();
            var stillTimeLeft=model.gameHasStarted&&model.secondsRemaining>0;
            if(stillTimeLeft){
                model.timer=tick()
            }
        },
        1000)
    }
    return tick()
}

function stopTimer(){
    clearTimeout(model.timer)
}
