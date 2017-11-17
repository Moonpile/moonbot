


var debug = require('debug')('botkit:channel_join');

module.exports = function(controller) {

controller.on('slash_command', function (bot, message) {
  // Validate Slack verify token
  
  /*var VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN;
  
  if (message.token !== VERIFY_TOKEN) {
    return bot.res.send(401, 'Unauthorized')
  }*/
  
  switch (message.command) {
    case '/roll':

      var diceParams = new diceParameters(message.text) 
      
      if (diceParams.isValid == true)
        {
          var diceRoll = rollDice(diceParams)
          console.log(diceRoll)
          var msg = '<@' + message.user_id + '> Rolled ' + message.text + ': *' + diceRoll.total + '* ' 
                + diceRoll.rollToString()
          bot.replyPublic(message, msg) 
        }
      else
        {
           bot.replyPrivate(message, 'Dice expression was invalid: ' + message.text)
        }
      //console.log(message)
      //console.log(diceParams)
      break
      case '/d100':
      
      var diceExp = '1d100'
      var target = message.text.substr(message.text.indexOf(' ') + 1)
      
      var diceParams = new diceParameters(diceExp) 
      
      var diceRoll = rollDice(diceParams)
      //console.log(diceRoll)
      var msg = '<@' + message.user_id + '> Rolled 1d100 targetting ' + target + ': ' + diceRoll.total + ' '

      var individualrolls = "("
      for (let roll of diceRoll.rolls)
        {
          individualrolls += roll + ','
        }
      if (individualrolls.endsWith(','))
        {
          individualrolls = individualrolls.substring(0, individualrolls.length-1)
        }
      individualrolls += ')'
      msg += individualrolls 
      
      var txtmsg = diceRoll.total
      var title = diceRoll.total
      var color = "#ffffff"
      if (diceRoll.total < target/10)
        {title+=' Critical!'
        color = "#006400"}
      else if (diceRoll.total < target/5)
        {title+=' Special!'
        color = "#228B22"}
      else if (diceRoll.total <= target)
        {title+=' Success!'
        color = "#00ff7f"}
      else if (diceRoll.total < 100 - target/10)
        {title+=' Fail'
        color = "#ff4500"}
      else {title+=' Fumble'
           color = "#ff0000"}
      var att = {
    "attachments": [
        {
            "fallback": msg,
            "color": color,
            "text": msg,
            "fields": [
                {
                    "title": title,
                    "value": individualrolls,
                    "short": false
                }
            ],
            "ts": Date.now()
        }
    ]
} 
      bot.replyPublic(message, att)
      break
      
      
      case '/?':
      bot.replyPrivate(message, 'Dice expressions consist of:\n' +
                      '*mandatory*:\n' +
                       'number of dice to roll, ie "1" or "7".  Must be integer greater than 1\n' +
                      'dice type: d, e, eu, ed, s, su, sd (/dicetypes for more info but you probably want "d")\n' +
                      'number of sides: ie "1", "20" or "100". Must be integer greater than 1\n' +
                      '*optional*:\n' +
                      'modifier: ie "+4" or "-3"\n'+
                      'floor: ie "f5" or "f-3" the roll will never be less than the floor\n'+
                      'ceiling: ie "c42" or "c-5" the roll will never be more than the ceiling\n'+
                      'threshold: if an individual die rolls above the threshold it adds one to the total ie 10d6t4 rolls ten six siders and counts one for every roll of four or more.')
      break
    case '/dicetypes':
    bot.replyPrivate(message, 'Dice types are: \n' +
                    'Normal dice "d" or "D"\n'+
                    'Exploding dice: "e" or "E", rolls of 1 or the max explode by subracting (for 1) or adding (for max) one more die which may also explode\n' +
                    'Exploding up dice: "eu" or "EU", as with exploding but only the max roll explodes.\n' +
                    'Exploding down dice: "ed" or "ED", as with exploding but only rolls of 1 explode.\n' +
                    'Smooth exploding dice: "s" or "S", similar to exploding dice but the die actually has two more sides than specified and explodes up on one or down on the other.\n' +
                    'Smooth exploding up dice: "su" or "SU", as with smooth exploding dice but only has one extra side and only explodes up.\n' +
                    'Smooth exploding down dice: "sd" or "SD", as with smooth exploding dice but only has one extra side and only exploeds down.')
      
      break
    default:
      bot.replyPrivate(message, "Sorry, I'm not sure what that command is")
  }
})
  
}

var diceParameters = function(diceExpression) {
  var myRegex = /^(\d+)?([dDeEsS]|eu|EU|ed|ED|su|SU|sd|SD)(\d+)([+-]\d+)?([fF]([-]?\d+))?([cC]([-]?\d+))?([tT]([-]?\d+))?$/;
  var match = myRegex.exec(diceExpression);
 
  this.diceExpression = diceExpression
  this.numDice = 1;
  this.diceType = "";
  this.numSides = 0;
  this.modifier = 0;
  this.errorMessage = "";
  this.isValid = false;
  this.isSmoothExploding = false;
  this.floor = 0;
  this.enforceFloor = false;
  this.ceiling = 0;
  this.enforceCeiling = false;
  this.threshold = 0;
  this.isThreshold = false;

  if (match === null) {
    this.errorMessage = "Bad Dice Expression '" + diceExpression + "'";
    this.isValid = false;
  }
  else 
    {
        if (match[1] != undefined) {
    this.numDice = match[1];
  }
  this.diceType = match[2].toLowerCase();
  this.isSmoothExploding = (this.diceType == "s" 
  													|| this.diceType == "su" 
                            || this.diceType == "sd");
  this.numSides = match[3];
  if (match[4] != undefined) {
    this.modifier = parseInt(match[4].replace("+", ""));
  }

  var enforceFloor = false;
  if (match[5] != undefined) {
    this.floor = parseInt(match[6]);
    this.enforceFloor = true;
  }

  var ceiling = 0;
  var enforceCeiling = false;
  if (match[7] != undefined) {
    this.ceiling = parseInt(match[8]);
    this.enforceCeiling = true;
  }

  var threshold = 0;
  var isThreshold = false;
  if (match[9] != undefined) {
    this.threshold = parseInt(match[10]);
    this.isThreshold = true;
  }
  
  this.isValid = true;
    }

}

var diceResult = function(){
  this.total = 0
  this.rolls = []
  this.diceParams
  this.rollToString = function(){
      var individualrolls = '('
      for (let roll of this.rolls)
        {
          //console.log(roll)
          if (isNaN(roll) && roll != '+' && roll != '-'){
            if (roll.rolls.length > 1) {
                individualrolls += roll.total 
                if (this.diceParams.isThreshold){
                    if (roll.total >= this.diceParams.threshold){individualrolls += '*'}
                  }
                individualrolls += ':' + roll.rollToString()
              }
            else {
               individualrolls += roll.total 
                  if (this.diceParams.isThreshold){
                    if (roll.total >= this.diceParams.threshold){individualrolls += '*'}
                  }
            }

              
          }
          else{
            individualrolls += roll 
            if (this.diceParams.isThreshold){
              if (roll >= this.diceParams.threshold) {individualrolls += '*'}
            }
          }
          individualrolls += ','
        }
      if (individualrolls.endsWith(','))
        {
          individualrolls = individualrolls.substring(0, individualrolls.length-1)
        }
      individualrolls += ')'
      return individualrolls 
  }
}

function rollDice(diceParams) {

  //var diceParams = new diceParameters(diceExpression);
  var total = 0;
  var result = new diceResult()
  result.diceParams = diceParams
  
  if (diceParams.diceType == "d") {
    for (var i = 0; i < diceParams.numDice; i++) {
      if (diceParams.isThreshold) {
        var tRoll = rollDie(diceParams.numSides) + diceParams.modifier;
        if (tRoll >= diceParams.threshold) {
          total += 1
          }
        result.rolls.push(tRoll)
      } else {
        var roll = rollDie(diceParams.numSides)
        result.rolls.push(roll)
        total = total + roll
      }
    }
  }

  if (diceParams.diceType == "e"){
    if (diceParams.numSides < 3){
      return "Non-smooth exploding dice must have more than two sides."
    }
    for (var i = 0; i < diceParams.numDice; i++){
      var exParams = new diceParameters(diceParams.diceExpression)
      exParams.isThreshold = false
      var explodeRoll = rollExplodingDieNew(exParams)
      if (diceParams.isThreshold){
        if (explodeRoll.total + diceParams.modifier >= diceParams.threshold){
          total += 1
        }
      }
      result.rolls.push(explodeRoll)
      if (!diceParams.isThreshold){
        total = total + explodeRoll.total
      }
      
    }
  }
  
  /*
  if (diceParams.diceType == "e" || diceParams.diceType == "s") {
    if (diceParams.numSides < 3 && !diceParams.isSmoothExploding) {
      return "Non-smooth exploding dice must have more than two sides.";
    }
    for (var i = 0; i < diceParams.numDice; i++) {
      if (diceParams.isThreshold) {
        var explodingResult = rollExplodingDie(diceParams.numSides, diceParams.isSmoothExploding)
        var tRoll =  explodingResult.total + diceParams.modifier
        if (tRoll > diceParams.threshold) {
          total += 1
        }
      } else {
        var normalResult = rollExplodingDie(diceParams.numSides, diceParams.isSmoothExploding)
        total = total + normalResult.total;
        for (let r of normalResult.rolls)
          {
            result.rolls.push(r)
          }
      }
    }
  }*/

  if (diceParams.diceType == "eu" || diceParams.diceType == "su") {
    for (var i = 0; i < diceParams.numDice; i++) {
      if (diceParams.isThreshold) {
        var tRoll = rollExplodingUpDie(diceParams.numSides, diceParams.isSmoothExploding) + diceParams.modifier;
        if (tRoll > diceParams.threshold) {
          total += 1;
        }
      } else {
        total = total + rollExplodingUpDie(diceParams.numSides, diceParams.isSmoothExploding);
      }
    }
  }

  if (diceParams.diceType == "ed" || diceParams.diceType == "sd") {
    for (var i = 0; i < diceParams.numDice; i++) {
      if (diceParams.isThreshold) {
        var tRoll = rollExplodingDownDie(diceParams.numSides, diceParams.isSmoothExploding) + diceParams.modifier;
        if (tRoll > diceParams.threshold) {
          total += 1;
        }
      } else {
        total = total + rollExplodingDownDie(diceParams.numSides, diceParams.isSmoothExploding);
      }
    }
  }

  if (!diceParams.isThreshold) {
    total += diceParams.modifier;
  }

  if (diceParams.enforceFloor) {
    if (total < diceParams.floor) {
      total = diceParams.floor;
      result.rolls.push(' floored to ' + diceParams.floor)
    }
  }

  if (diceParams.enforceCeiling) {
    if (total > diceParams.ceiling) {
      total = diceParams.ceiling;
      result.rolls.push(' ceilinged to ' + diceParams.ceiling)
    }
  }
 
  result.total = total
  return result;
}

function rollDie(numSides) {
  return Math.ceil(Math.random() * numSides);
}

function rollExplodingDieNew(diceParams) {
  var numSides = diceParams.numSides
  var result = new diceResult()
  result.diceParams = diceParams
  var roll = rollDie(numSides)
  var total = 0
  if (roll == 1){
    total = 1
    var downRoll = rollExplodingDieNew(diceParams)
    total = total - downRoll.total
    result.rolls.push(roll)
    result.rolls.push(downRoll)
  }
  else if (roll == numSides) {
    total = roll
    var upRoll = rollExplodingDieNew(diceParams)
    total = total + upRoll.total
    result.rolls.push(roll)
    result.rolls.push(upRoll)
  }
  else {
    total = roll
    result.rolls.push(roll)
  }
  result.total = total
  return result
}

function rollExplodingDie(numSides, isSmooth) {

  var result = new diceResult()
  
  var s = parseInt(numSides)
  if (isSmooth) {
    s = s + 2
  }
  var roll = rollDie(s);
  var total = 0;
  if (isSmooth && roll > numSides) {
    if (roll == s - 1) {
      total = 1;
      result.rolls.push('1-')
    } else if (roll == s) {
      total = roll
      result.rolls.push(roll + "+")
    }

  } else {
    total = roll
    result.rolls.push(roll)
  }

  if (isSmooth) {
    result.rolls.push("[")
    while (roll > numSides) {

      if (roll == s - 1) {
        roll = rollDie(s)
        total -= roll
        result.rolls.push(roll)
        //alert("DOWN numSides: " + numSides + " roll: " + roll);
      }
      if (roll == s) {
        roll = rollDie(s)
        total += roll
        result.rolls.push(roll)
        //alert("UP numSides: " + numSides + " roll: " + roll + " total: " + total);
      }
    }
    result.rolls.push("]")
  } else {
    result.rolls.push("[")
    while (roll === 1 || roll == numSides) {
      if (roll === 1) {
        roll = rollDie(numSides)
        total -= roll
        result.rolls.push(roll)
      }
      if (roll == numSides) {
        roll = rollDie(numSides)
        total += roll
        result.rolls.push(roll)
      }
    }
    result.rolls.push("]")
  }
  result.total = total
  return result
}

function rollExplodingUpDie(numSides, isSmooth) {
  var roll = rollDie(numSides);
  var total = roll;
  while (roll == numSides) {
    if (roll == numSides) {
      roll = rollDie(numSides);
      total += roll;
    }
  }
  return total;
}

function rollExplodingDownDie(numSides, isSmooth) {
  var roll = rollDie(numSides);
  var total = roll;
  while (roll == 1) {
    if (roll == 1) {
      roll = rollDie(numSides);
      total -= roll;
    }
  }
  return total;
}