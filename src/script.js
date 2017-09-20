document.getElementById("amount").addEventListener("keydown", function(event) {
    if (event.keyCode == 13 || event.keyCode == 190 || event.keyCode == 110) {
        event.preventDefault();
    }
});
document.getElementById("amount").addEventListener("keyup", outputScript);
document.getElementById("swap").addEventListener("click", flip);
document.getElementById("transaction").addEventListener("change", updateCurrency);
document.getElementById("origin").addEventListener("change", updateCurrency);
document.getElementById("recipient").addEventListener("change", updateCurrency);


// fetch ptax buy and sell BR$
const url = 'https://api.vitortec.com/currency/quotation/v1.2/';
fetch(url)
    .then((resp) => resp.json())
    .then(function (data) {
        let countries = data.data.currency;
        return countries.map(function (country) {
            let span = document.createElement('span');
            bid = country.buying;
            bid = bid.substring(0, bid.length - 4);
            ask = country.selling;
            ask = ask.substring(0, ask.length - 4);
            if (country.code == "USD") {
                span.innerHTML = `${"Compra: " + bid +"</br>"} ${"Venda: " + ask}`;
                document.getElementById('buy').innerHTML = bid;
                document.getElementById('sell').innerHTML = ask;
                document.getElementById('td').innerHTML = span.innerHTML;
            }
        })
    })
    .catch(function (error) {
        console.log(JSON.stringify(error));

    });

// main function to output the table and script on compare submit
function outputScript() {
    var output = document.getElementById("root");
    var origin = document.getElementById("origin").value;
    origin = origin.substring(0, origin.length - 6);
    var recipient = document.getElementById("recipient").value;
    recipient = recipient.substring(0, recipient.length - 6);
    var transaction = document.getElementById("transaction").value;
    var amount = document.getElementById("amount").value;
    var currency = document.getElementById("currency").innerHTML;
    var fraction = document.getElementById("fraction").innerHTML;
    if (recipient == "EE.UU."){
        var flag = "<img src='images/USflag.png' alt='US flag' id='flag'>";
        var altflag= "<img src='images/BRflag.png' alt='US flag' id='flag'>";
    } else {
        var flag = "<img src='images/BRflag.png' alt='Brasil flag' id='flag'>";
        var altflag= "<img src='images/USflag.png' alt='US flag' id='flag'>";
    }
    if (transaction == "enviar") {
        var phrase = "Cantidad recibida de enviar " + amount + " " + currency + " a " + flag + ":";
    } else {
        var phrase = "Costo para recibir " + amount + " " + currency + " de " + altflag + ":";
    }

    document.getElementById("tbody").classList.add("invisible");
    document.getElementById("thead").classList.add("invisible");
    document.getElementById("difference").classList.add("invisible");
    if (!amount) {
        output.innerHTML = "Por favor ingrese una cantidad!";
    } else if (amount < 1) {
        output.innerHTML = "Introduzca una cantidad superior a 1 dólar.";
    } else if (amount >= 5000 && currency == "USD") {
        output.innerHTML = "Por favor ingrese una cantidad menor de $5,000";
    } else if (amount >= 20000 && currency == "BRL") {
        output.innerHTML = "Por favor ingrese una cantidad menor de R$20.000";
    } else {
        output.innerHTML = phrase;
        var ptax = getNum(recipient);
        document.getElementById('td').innerHTML = ptax;
        tableBody(ptax, recipient, transaction);
        getDifference(recipient, transaction);
    }
}

// helper funtion to get correct ptax 
function getNum(recipient) {
    var num = 0.0;
    if (recipient == "EE.UU.") {
        num = parseFloat(document.getElementById('buy').innerHTML);
        num = num / 10;
    } else {
        num = parseFloat(document.getElementById('sell').innerHTML);
    }
    return num;
}

// function takes in the correct information and outputs the table with the data received
function tableBody(ptax, recipient, transaction) {
    var amount = document.getElementById("amount").value;
    amount = parseFloat(amount);
    var iof = .0038;
    var ourSpread = altalovaSpread(amount, ptax); 
    if (ptax > 1) { // sending from US
        var mgFee = usFee(amount);
        var mgRate = fourDecimal(ptax - .1742);
        var bankFee = 45; // figure out
        var bankRate = fourDecimal(ptax - .1);
    } else { // sending from Brasil
        var mgFee = brFee(amount, ptax);
        var mgRate = fourDecimal(ptax + .01742 * (1 + iof));
        var bankFee = amount * .0166;
        if (bankFee < 36) {
            bankFee = 36;
        } else if (bankFee > 166) {
            bankFee = 166;
        }
        bankFee = (bankFee/ptax);
        var bankRate = fourDecimal((ptax + .015) * (1 + iof));
        var onlineSpread = getSpread(amount, ptax);
        var onlineRate = fourDecimal(ptax * (1 + onlineSpread + iof));
    }
    var mgTotal = twoDecimal(amount + mgFee);
    var onlineTotal = twoDecimal(amount + 62.10);
    var bankTotal = twoDecimal(amount + bankFee);
    var altalovaTotal = twoDecimal(amount * ourSpread);
    ptax = fourDecimal(ptax);

    if (recipient == "Brasil" && transaction == "enviar") {
        var bank = "R$" + toBRL(twoDecimal(amount * bankRate));
        var bankCost = "$" + bankTotal;
        var mg = "R$" + toBRL(twoDecimal(amount * mgRate));
        var mgCost = "$" + mgTotal;
        var online = "<div style='font-size: 22px'>Servicio no ofrecido</div>";
        var altalova = "R$" + toBRL(twoDecimal(amount * ptax));
        var altalovaCost = "$" + altalovaTotal;
    } else if (recipient == "EE.UU." && transaction == "enviar") {
        var bank = "$" + twoDecimal(amount/ (bankRate * 10));
        var bankCost = "R$" + toBRL(bankTotal);
        var mg = "$" + twoDecimal(amount/ (mgRate * 10));
        var mgCost = "R$" + toBRL(mgTotal);
        var online = "<div style='font-size: 20px'>Límite de transferencia alcanzado</div>";
        if (amount < 10000) {
            var online = "$" + twoDecimal(amount/ (onlineRate * 10));
            var onlineCost = "R$" + toBRL(mgTotal);
        }
        var altalova = "$" + twoDecimal(amount/ (ptax * 10));
        var altalovaCost = "R$" + toBRL(altalovaTotal);
    } else if (recipient == "Brasil" && transaction == "recibir") {
        var bank = "$" + twoDecimal((amount/ bankRate) + bankFee);
        var mg = "$" + twoDecimal((amount/ mgRate) + mgFee);
        var online = "<div style='font-size: 22px'>Servicio no ofrecido</div>";
        var altalova = "$" + twoDecimal((amount/ ptax) * ourSpread);
    } else {
        var bank = "R$" + toBRL(twoDecimal((amount * (bankRate * 10) + (bankFee * ptax))));
        var mg = "R$" + toBRL(twoDecimal((amount * (mgRate * 10) + (mgFee * ptax))));
        var online = "<div style='font-size: 20px'>Límite de transferencia alcanzado</div>";
        if (amount < 3000) {
            var online = "R$" + toBRL(twoDecimal(((amount * (onlineRate * 10)) + 62.10)));
        }    
        var altalova = "R$" + toBRL(twoDecimal((amount * (ptax * 10) * ourSpread)));
    }

    if (transaction == "enviar") {
        document.getElementById("banksHead").innerHTML = bankRate + "<br>Coste Total: " + bankCost;
        document.getElementById("mgHead").innerHTML = mgRate + "<br>Coste Total: " + mgCost;
        if (recipient == "EE.UU." && amount < 10000){
            document.getElementById("onlineHead").innerHTML = "<i>*Tipo de cambio: " + onlineRate + "<br>Coste Total: " + onlineCost + "</i>";
        } else {
            document.getElementById("onlineHead").innerHTML = "<i>*Tipo de cambio no disponible</i>";
        }
        document.getElementById("altalovaHead").innerHTML = ptax + "<br>Mejor Coste: " + altalovaCost;
    } else {
        document.getElementById("banksHead").innerHTML = bankRate
        document.getElementById("mgHead").innerHTML = mgRate;
        if (recipient == "EE.UU." && amount < 3000){
            document.getElementById("onlineHead").innerHTML = "<i>*Tipo de cambio: " + onlineRate + "</i>";
        } else {
            document.getElementById("onlineHead").innerHTML = "<i>*Tipo de cambio no disponible</i>";
        }
        document.getElementById("altalovaHead").innerHTML = ptax;
    }
    document.getElementById("tbody").classList.remove("invisible");
    document.getElementById("banks").innerHTML = bank;
    document.getElementById("mg").innerHTML = mg;
    document.getElementById("online").innerHTML = online;
    document.getElementById("altalova").innerHTML = altalova;
}

// function gets spread for online transfer Service
function getSpread(amount, ptax){
    amount = (amount + 62.10) * ptax;
    var spread = .0225;
    if (amount < 500){
        spread = .0245;
    } else if (amount < 1000){
        spread = .0235;
    } else if (amount < 1500){
        spread = .0225;
    } else if (amount < 2000){
        spread = .0214;
    } else if (amount < 2500){
        spread = .0203;
    } else if (amount < 3000){
        spread = .0191;
    } else if (amount > 3000){
        spread = .0184;
    }
    return spread;
}

function altalovaSpread(amount, ptax){
    if (ptax > 1) {
        amount = amount * ptax;
    }
    var spread = 1.03;
    if (amount < 500){
        spread = 1.04;
    } else if (amount < 1000){
        spread = 1.035;
    }  else if (amount < 2000){
        spread = 1.03;
    }  else if (amount < 2200){
        spread = 1.028;
    } else if (amount < 2380){
        spread = 1.026;
    } else if (amount < 2580){
        spread = 1.024;
    } else if (amount < 2800){
        spread = 1.022;
    } else if (amount < 3000){
        spread = 1.020;
    } else if (amount < 3200){
        spread = 1.018;
    } else if (amount < 3400){
        spread = 1.016;
    } else if (amount < 3600){
        spread = 1.014;
    } else if (amount < 3800){
        spread = 1.012;
    } else if (amount < 4000){
        spread = 1.010;
    } else if (amount < 7750){
        spread = 1.008;
    } else if (amount < 8850){
        spread = 1.007;
    } else if (amount < 10000){
        spread = 1.006;
    } else if (amount >= 10000){
        spread = 1.005;
    }
    return spread;
}

// funtion calculates the amount saved by using altalova
function getDifference(recipient, transaction) {
    document.getElementById("difference").classList.add("difference");
    document.getElementById("bred").classList.remove("red");
    document.getElementById("tred").classList.remove("red");
    var altalova = document.getElementById("altalova").innerHTML.replace(",", ".");
    var bank = document.getElementById("banks").innerHTML.replace(",", ".");
    var mg = document.getElementById("mg").innerHTML.replace(",", ".");
    var best = parseFloat(altalova.substring(altalova.indexOf("$") + 1));
    var bank = parseFloat(bank.substring(bank.indexOf("$") + 1));
    mg = parseFloat(mg.substring(mg.indexOf("$") + 1));
    var currency = altalova.substring(0, altalova.indexOf("$") + 1);

    if (transaction == "enviar"){
        var low = mg;
        if (bank < low) {
            low = bank;
            document.getElementById("bred").classList.add("red");
        } else {
            document.getElementById("tred").classList.add("red");
        }
        var extra = twoDecimal(best - low);
        if (currency == "R$") {
            extra = toBRL(extra); 
        }
        document.getElementById("difference").innerHTML = "*Cantidad Adicional Recibida= <b style='font-size: larger;'>" + currency + extra + "</b>";                
        document.getElementById("difference").classList.remove("invisible");
    } else {
        var high = bank;
        if (mg > high) {
            high = mg;
            document.getElementById("tred").classList.add("red");
        } else {
            document.getElementById("bred").classList.add("red");
        }
        var saved = twoDecimal(high - best);
        if (saved > 0) {
            if (currency == "R$") {
                saved = toBRL(saved); 
            }
            document.getElementById("difference").innerHTML = "*Cantidad Total Guardada= <b style='font-size: larger;'>" + currency + saved + "</b>";                
            document.getElementById("difference").classList.remove("invisible");
        }
    }
}

// helper function for two decimal limit
function twoDecimal(number) {
    return number.toFixed(2);
}

// helper function for two decimal limit
function fourDecimal(number) {
    return number.toFixed(4);
}

function toBRL(number) {
    return number.toString().replace(".", ",");
}

// calculates MoneyGram fee to enviar money from br to us
function brFee(amount, ptax) {
    amount = amount * ptax;
    var fee = 22;
    if (amount > 235 && amount <= 355) {
        fee = 30;
    } else if (amount > 355 && amount <= 465) {
        fee = 34;
    } else if (amount > 465 && amount <= 580) {
        fee = 38;
    } else if (amount > 580 && amount <= 870) {
        fee = 42;
    } else if (amount > 870 && amount <= 1165) {
        fee = 46;
    } else if (amount > 1165 && amount <= 1450) {
        fee = 50;
    } else if (amount > 1450 && amount <= 1740) {
        fee = 54;
    } else if (amount > 1740 && amount <= 2020) {
        fee = 58;
    } else if (amount > 2020 && amount <= 2320) {
        fee = 63;
    } else if (amount > 2320 && amount <= 2900) {
        fee = 72;
    } else if (amount > 2900 && amount <= 3480) {
        fee = 84;
    } else if (amount > 3480 && amount <= 4070) {
        fee = 96;
    } else if (amount > 4070 && amount <= 4650) {
        fee = 108;
    } else if (amount > 4650 && amount <= 5200) {
        fee = 120;
    } else if (amount > 5200 && amount <= 5800) {
        fee = 132;
    } else if (amount > 5800 && amount <= 6380) {
        fee = 144;
    } else if (amount > 6380 && amount <= 6950) {
        fee = 156;
    } else if (amount > 6950 && amount <= 7530) {
        fee = 168;
    } else if (amount > 7530 && amount <= 8100) {
        fee = 180;
    } else if (amount > 8100 && amount <= 8700) {
        fee = 192;
    } else if (amount > 8700 && amount <= 9280) {
        fee = 204;
    } else if (amount > 9280) {
        fee = 216
    }
    return fee / ptax;
}

// calculates MoneyGram fee to enviar money from us to br
function usFee(amount) {
    var fee = 9.99;
    if (amount >= 1000) {
        fee = 21.20
    }
    if (amount >= 1010) {
        var mult = (amount - 1010) / 10;
        fee += mult * .20;
    }
    return fee;
}

// function fo the flip button, switches origin and recipient and the currencys 
function flip() {
    if (document.getElementById("origin").selectedIndex == "0") {
        document.getElementById("origin").selectedIndex = "1";
    } else if (document.getElementById("origin").selectedIndex == "1") {
        document.getElementById("origin").selectedIndex = "0";
    }

    if (document.getElementById("recipient").selectedIndex == "0") {
        document.getElementById("recipient").selectedIndex = "1";
    } else if (document.getElementById("recipient").selectedIndex == "1") {
        document.getElementById("recipient").selectedIndex = "0";
    }
    updateCurrency();
}

// alterate between currencies 
function updateCurrency() {
    if (document.getElementById("transaction").selectedIndex == "1") {
        var recipient = document.getElementById("recipient").value;
        recipient = recipient.substring(recipient.indexOf("(") + 1, recipient.length - 1);
        document.getElementById("currency").innerHTML = recipient;
    } else {
        var origin = document.getElementById("origin").value;
        origin = origin.substring(origin.indexOf("(") + 1, origin.length - 1);
        document.getElementById("currency").innerHTML = origin;
    }

    if (document.getElementById("currency").innerHTML == "USD") {
        document.getElementById("symbol").innerHTML = "$";
        document.getElementById("fraction").innerHTML = ".00";
    } else {
        document.getElementById("symbol").innerHTML = "R$";
        document.getElementById("fraction").innerHTML = ",00";
    }
    if (document.getElementById("amount").value) {
        outputScript();
    }
}
