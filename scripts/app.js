var state = {
    browse: {
        next: null,
        prev: null,
        pokemons: [],
        numberOfPokemon: 0,
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
    grid.html("");
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
    toggleButtons();
}

//A function to toggle the navigation buttons depending on whether there are more pokemon to fetch
const toggleButtons = () => {
    const { next, prev } = state.browse;
    if(next !== null && prev !== null) {
        $("#prev-btn").css("display", "block");
        $("#next-btn").css("display", "block");
    } else if(next === null) {
        $("prev-btn").css("display", "block"); 
    } else if(prev === null) {
        $("#next-btn").css("display", "block");
    }
}


// A function dedicated to take an array of promises and return the requestJSON objects from the request
const extractPokemonFromRequest = (requests) => {
    const pokemonObjects = [];
    for(let i = 0; i < requests.length; i++) {
        pokemonObjects.push(requests[i].responseJSON);
    }
    return pokemonObjects;
};

//A function fetches all the pokemon on a given page
const loadPokemon = (direction) => {
    $.getJSON(direction, (data) => {
        state.browse.prev = data.previous;
        state.browse.next = data.next;
        state.browse.numberOfPokemon = data.count;
        const results = data.results;
        const requests = [];
        for(let i = 0; i < results.length; i++) {
            requests.push($.getJSON(results[i].url));
        }
        $.when(...requests).done(() => {
            pokemons = extractPokemonFromRequest(requests);
            state.browse = { ...state.browse, pokemons: [...pokemons] };
            displayPokemon();
        });
    });
};


$(document).ready(() => {
    $("#prev-btn").on("click", () => {
        loadPokemon(state.browse.prev);
        $("#prev-btn").css("display", "none");
    });
    $("#next-btn").on("click", () => {
        loadPokemon(state.browse.next);
        $("#next-btn").css("display", "none");
    });
});


loadPokemon("https://pokeapi.co/api/v2/pokemon");

