var state = {
    browse: {
        pokemons: [],
        numberOfPokemon: 964,
        count: 0,
        step: 20
    },
    favourites: {

    },
    compare: {

    }
};
// A function which takes the current loaded pokemons and displays them in the grid
const displayPokemon = () => {
    const pokemons = state.browse.pokemons;
    const grid = $(".pokemon-grid");
    for(let i = 0; i < pokemons.length; i++){
        grid.append (`
        <div class="col-12 col-sm-6 col-md-3 p-4 pokemon">
            <div class="square">
                <img class="pokemon-img" src="${pokemons[i].sprites.front_default}">
                <p class="pokemon-name">
                    ${pokemons[i].name}
                </p>
            </div>
        </div>`
        )
    }
};

// A function dedicated to take an array of promises and return the requestJSON objects from the request
const extractPokemonFromRequest = (requests) => {
    const pokemonObjects = [];
    for(let i = 0; i < requests.length; i++) {
        pokemonObjects.push(requests[i].responseJSON);
    }
    return pokemonObjects;
};



//Function fetches the next set of pokemon and adds them to the state
const loadPokemon = () => {
    const requests = [];
    let pokemons = [];
    let count = state.browse.count;
    const { numberOfPokemon, step} = state.browse;
    let numberOfPokemonsToFetch = step;
    if(count + step > numberOfPokemon) {
        numberOfPokemonsToFetch = numberOfPokemon - count;
        count = numberOfPokemon;
    }
    for(let i = 1; i < numberOfPokemonsToFetch + 1; i++) {
        requests.push($.getJSON(`https://pokeapi.co/api/v2/pokemon/${i}`));
    };
    $.when(...requests).done(() => {
        pokemons = extractPokemonFromRequest(requests);
        state.browse = {...state.browse, count: count + numberOfPokemonsToFetch, pokemons: [...pokemons] };
        displayPokemon();
    });    
};




(function main() {
    loadPokemon();
}());

