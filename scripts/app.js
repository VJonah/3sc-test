const state = {
    browse: {
        next: null,
        prev: null,
        pokemons: [],
        numberOfPokemon: 0,
    },
    favourites: {
        pokemons: [],
        viewFavourites: false
    },
    compare: {
        pokemons: [],
        comparing: false
    },
    view: {
        pokemon: null,
    }
};


//A function fetches all the pokemon on a given page
const loadPokemon = (direction) => {
    $.getJSON(direction, (data) => {
        state.browse = {...state.browse, prev: data.previous, next: data.next, numberOfPokemon: data.count };
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

// A function dedicated to take an array of promises and return the requestJSON objects from the request
const extractPokemonFromRequest = (requests) => {
    const pokemonObjects = [];
    for(let i = 0; i < requests.length; i++) {
        pokemonObjects.push(requests[i].responseJSON);
    }
    return pokemonObjects;
};

// A function to check if an array of pokemon objects contains a pokemon
const includesPokemon = (array, pokemon) => {
    const result = array.find((element) => {
        if(element.name === pokemon.name) {
            return element;
        };
    });
    if (typeof result === 'undefined') {
        return false;       
    } else {
        return true;
    }
};
// A function to get the index of a pokemon object in an array
const pokemonIndex = (array, pokemon) => {
    return array.findIndex((element) => element.name === pokemon.name);
}

// A function which takes the current loaded pokemons and displays them in the grid
const displayPokemon = (pokemons) => {
    if (typeof pokemons === 'undefined') {
        pokemons = state.browse.pokemons;
        toggleButtons();
    }
    const grid = $(".pokemon-grid");
    grid.html("");
    for(let i = 0; i < pokemons.length; i++){
        grid.append (`
        <div class="col-12 col-sm-6 col-md-3 p-4">
            <div class="square" meta="${pokemons[i].name}">
                <img class="pokemon-img" src="${pokemons[i].sprites.front_default}">
                <p class="pokemon-name">
                    ${pokemons[i].name}
                </p>
            </div>
        </div>`
        )
    }
    addPokemonEvents();
}

//A function to add the on click events to the dynamically created pokemon elements
const addPokemonEvents = () => {
    $(".square").on("click", function(event) {
        clickedPokemon = event.delegateTarget.attributes.meta.nodeValue;
        const pokemons = state.browse.pokemons;
        const favouritedPokemons = state.favourites.pokemons;
        $(this).toggleClass("square-pressed");
        const clickedPokemonData = pokemons.filter((p) => {
            if(p.name === clickedPokemon){
                return p;
            }
        })[0];
        const comparing = state.compare.comparing;
        if(comparing) {
            console.log("click");
            const comparedPokemons = state.compare.pokemons;
            if(includesPokemon(comparedPokemons, clickedPokemonData)) {
                comparedPokemons.splice(pokemonIndex(comparedPokemons,clickedPokemonData), 1);
            } else {
                comparedPokemons.push(clickedPokemonData);
            }
            state.compare = { ...state.compare, pokemons: comparedPokemons };
        } else {
            state.view = { pokemon: clickedPokemonData};
            $("body").css("position", "fixed");
            $("#viewer").css("display", "block");
            displayPokemonData();
            if(includesPokemon(favouritedPokemons, state.view.pokemon)) {
                $(".favourite-icon").addClass("icon-pressed");
            }
        }
    });
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

//A function to take pokemon's fetched data and display it in a lightbox.
const displayPokemonData = () => {
    const pokemon = state.view.pokemon;
    const name = pokemon.name[0].toUpperCase() + pokemon.name.substring(1);
    $(".view-img").attr("src", pokemon.sprites.front_default)
    $("#name").html(name);
    $("#height").html(pokemon.height);
    $("#weight ").html(pokemon.weight);
    $("#stats").html("");
    for(let i = 0; i < pokemon.stats.length; i++) {
        const name = pokemon.stats[i].stat.name;
        const stat = pokemon.stats[i].base_stat;
        $("#stats").append(`
            <tr>
                <td class="pokemon-stats">${name}</td>
                <td class="pokemon-stats-base">${stat}</td>
            </tr>
        `);
    }
    $("#types").html("");
    for(let i = 0; i < pokemon.types.length; i++) {
        const type = pokemon.types[i].type.name;
        $("#types").append(`
            <tr>
                <td class="pokemon-types">${type}</td>
            </tr>
        `);
    };
}

$(document).ready(() => {
    $("#prev-btn").on("click", () => {
        loadPokemon(state.browse.prev);
        $("#prev-btn").css("display", "none");
        $("#next-btn").css("display", "none");
    });
    $("#next-btn").on("click", () => {
        loadPokemon(state.browse.next);
        $("#next-btn").css("display", "none");
        $("#prev-btn").css("display", "none");
    });
    $(".back-btn").on("click", () => {
        $("#viewer").css("display", "none");
        $("#comparer").css("display", "none");
        $(".favourite-icon").removeClass("icon-pressed");
        $("body").css("position", "relative");
        $(".square").removeClass("square-pressed");
    });
    $(".favourite-icon").on("click", function() {
        const pokemons = state.favourites.pokemons;
        const pokemon = state.view.pokemon;
        if(includesPokemon(pokemons, pokemon)){
            pokemons.splice(pokemonIndex(pokemons,pokemon), 1);
        } else {
            pokemons.push(state.view.pokemon);
        }
        state.favourites = { ...state.favourites, pokemons: pokemons};
        $(this).toggleClass("icon-pressed");
        if(state.favourites.viewFavourites) {
            displayPokemon(pokemons);
        }
    });
    $("#logo").on("click", () => {
        state.compare = { pokemons: [], comparing: false };
        $('#compare').removeClass("compare-pressed");
        displayPokemon();
        state.favourites.viewFavourites = false;
    });
    $("#favourites").on("click", () => {
        state.compare = { pokemons: [], comparing: false };
        state.favourites = {...state.favourites, viewFavourites: true};
        $('#prev-btn').css("display", "none");
        $('#next-btn').css("display", "none");
        $('#compare').removeClass("compare-pressed");
        const pokemons = state.favourites.pokemons;
        displayPokemon(pokemons);

    });
    $("#compare").on("click", function() {
        state.compare = { pokemons: [], comparing: true};
        $(".square").removeClass("square-pressed");
        $(this).toggleClass("compare-pressed");
    });
});


loadPokemon("https://pokeapi.co/api/v2/pokemon");
