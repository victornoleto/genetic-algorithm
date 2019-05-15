function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;  
}

function roll(rate) {
    return Math.random() <= rate;
}

function randomFromArray(arr, not, index) {

    index = index === undefined ? 0 : index;

    var k = randomInt(0, arr.length - 1);
    var item = arr[k];

    if (not && item === not) {

        index++;
        if (index < 100) {
            return randomFromArray(arr, not, index);

        } else {
            return false;
        }

    } else {
        return item;
    }
}

function array_column(arr, column) {

    var result = [];
    arr.forEach(function(row) {
        result.push(row[column]);
    })

    return result;
}

function array_sum(arr) {
    return arr.reduce(function(a, b) { return a + b; }, 0)
}

function array_avg(arr) {
    return array_sum(arr) / arr.length;
}

function array_multiply(arr) {
    return arr.reduce(function(a, b) { return a * b; }, 1)
}

function clone(item) {
    return JSON.parse(JSON.stringify(item));
}

function roulette(objects, key) {

    var values = array_column(objects, key);
    var min = Math.min(...values);
    var list = clone(objects);

    list.forEach(function(item) {
        item[key] += (Math.abs(min) + 1);
    });

    var total = array_sum(array_column(list, key));
    var seed = Math.floor(Math.random() * total);
    
    for (var i = 0; i < list.length; ++i) {
        var object = list[i];
        var rate = object[key];
        if (seed < rate) return i;
        seed -= rate;
    }

    return false;
}

function chunkStr(str, size) {
    return str.match(new RegExp('.{1,' + size + '}', 'g'));
}

