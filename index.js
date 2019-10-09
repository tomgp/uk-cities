
console.log('uk cities v0.1');

const normalise = (str) => {
    if(!str || str == '') return null;
    return String(str)
        .toLowerCase()
        .replace('ù','u')
        .replace('è','e')
        .replace('é','e')
        .replace('ú','u')
        .replace('á','a')
        .replace(/[\s\W]/g, '');
}

const addNormalisedNames = d => {
    d.normalisedNames = [
        normalise(d.name),
        ...d.acceptable.split(',').map(e=>normalise(e)),
        normalise(d.welsh),
        normalise(d['scottish gaelic']),
        normalise(d['cornish'])
    ].filter(value=>value!=null);
    return d;
}

const drawGuessedList = cities => {
    const guessedCities = cities
        .filter(city=>(city.guessed))
        .sort((cityA, cityB)=>(cityB.guessed - cityA.guessed));

    const cityListItems = d3.select('#guessed-cities ul')
        .selectAll('li')
        .data(guessedCities, city=>city.name);
    
    cityListItems.enter()
        .append('li')
        .text(d=>d.name);
    
    cityListItems.exit().remove();
}

const drawCompletionScores = cities => {
    const completionGroups = [
        {
            key:d=>d["over 1 million"],
            description:"Cities with population over 1 mil",
        },{
            key:d=>d["over 100000"],
            description:" ... over 100,000",
        },{
            key:d=>d["over 10000"],
            description:" ... over 10,000",
        },{
            key:d=>(d.population<10000),
            description:"Tiny cities",
        }]
        .map(group=>{
            const groupCities = cities.filter(city=>(group.key(city)=='true' || group.key(city)==true));
            const completedCities = groupCities.filter(city=>city.guessed);
            return `${group.description}: ${completedCities.length}/${groupCities.length}`
        });

    const total = `<b>${cities.filter(city=>city.guessed).length}/${cities.length} cities</b>`
    const completionListItems = d3.select('#complete ul')
        .selectAll('li')
        .data([total, ...completionGroups]);
    
    completionListItems.enter()
        .append('li')
        .html(d=>d);
    
    completionListItems.html(d=>d);
}

function addMap(data){
    const width = 400, height = 600;

    const map = d3.select('#map svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${-width/2}, ${0})`);

    const projection = d3.geoOrthographic()
        .rotate([1,-57,0])
        .scale(2700);

    const path = d3.geoPath(projection);

    map.selectAll('path')
        .data(data.features)
            .enter()
        .append('path')
            .attr('d', path);

    map.append('g').attr('class','interaction-layer')

    function addDots(cities){
        const guessedCities = cities
            .filter(city=>(city.guessed))
            .sort((cityA, cityB)=>(cityB.guessed - cityA.guessed));
    
        const circles = map
            .selectAll('circle')
            .data(guessedCities, city=>city.name);
        
        circles.enter()
            .append('circle')
            .attr('cx',d=>{
                return projection([Number(d.lon),Number(d.lat)])[0]
            })
            .attr('cy',d=>{
                return projection([Number(d.lon),Number(d.lat)])[1]
            })
            .attr('r',5)

    }

    return addDots;
}

function go(){
    d3.tsv('cities.tsv', addNormalisedNames)
        .then(cities=>{
            let map;
            d3.json('./map.geo.json')
                .then((d)=>{
                    map = addMap(d);
                });

            const inputText = d3.select('#guess-input');
            
            const test = guessString=>cities.filter(city=>(city.normalisedNames.indexOf(guessString)>-1))[0];
            let guessOrder = 1;

            d3.select('.guess').node()
                .addEventListener('click', function(ev){
                    ev.preventDefault();
                    const value = d3.select('input').node().value;
                    const city = test(normalise(value));
                    if(city){
                        if(!city.guessed){
                            city.guessed = guessOrder;
                            guessOrder ++;
                        }                    
                        drawGuessedList(cities);
                        drawCompletionScores(cities);
                        map(cities);
                    }else{
                        console.log('nope');
                    };
                    inputText.node().value = '';
                    return false;
                })

            inputText.node()
                .addEventListener('keyup', function(ev){
                    if(ev.code == 'Enter'){
                        const city = test(normalise(ev.target.value));
                        if(city){
                            if(!city.guessed){
                                city.guessed = guessOrder;
                                guessOrder ++;
                            }                    
                            drawGuessedList(cities);
                            drawCompletionScores(cities);
                            map(cities);
                        }else{
                            console.log('nope');
                        };
                        inputText.node().value = '';
                    }
                    
                });
        });
}

go();