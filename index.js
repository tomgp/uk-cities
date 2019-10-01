
console.log('uk cities v0.1');

d3.csv('cities.tsv')
    .then(cities=>{
        console.log(cities);
    })