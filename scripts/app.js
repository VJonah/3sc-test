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

//A function to get the data of the pokemon from an array
const getPokemonDataFromName = (array, pokemon) => {
    return array.filter((p) => {
        if(p.name === pokemon) {
            return p;
        }
    })[0];
};

//A function to format a pokemon's stats for displaying
const formatStatsForDisplay = (pokemon) => {
    let resultHTML = "";
    for(let i = 0; i < pokemon.stats.length; i++) {
        const name = pokemon.stats[i].stat.name;
        const stat = pokemon.stats[i].base_stat;
        resultHTML += `
            <tr>
                <td class="pokemon-stats">${name}</td>
                <td class="pokemon-stats-base">${stat}</td>
            </tr>
        `;
    }
    return resultHTML;
}

// A function to format a pokemon's types for displaying
const formatTypesForDisplay = (pokemon) => {
    let resultHTML = "";
    for(let i = 0; i < pokemon.types.length; i++) {
        const type = pokemon.types[i].type.name;
        resultHTML += `
            <tr>
                <td class="pokemon-types">${type}</td>
            </tr>
        `;
    };
    return resultHTML;
}

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
    if(state.compare.comparing) {
        const pokemons = state.compare.pokemons;
        for(let i = 0; i < pokemons.length; i++) {
            const name = pokemons[i].name;
            const pokemonElement = $(`.square:contains('${name}')`);
            if(pokemonElement !== undefined){
                pokemonElement.addClass("square-pressed");
            }
        }
    }
    addPokemonEvents();
}

//A function to add the on click events to the dynamically created pokemon elements
const addPokemonEvents = () => {
    $(".square").on("click", function(event) {
        clickedPokemon = event.delegateTarget.attributes.meta.nodeValue;
        const pokemons = state.browse.pokemons;
        const favouritedPokemons = state.favourites.pokemons;
        let clickedPokemonData = getPokemonDataFromName(pokemons, clickedPokemon);
        $(this).toggleClass("square-pressed");
        if(state.favourites.viewFavourites) {
            clickedPokemonData = getPokemonDataFromName(favouritedPokemons, clickedPokemon);
        }
        
        const comparing = state.compare.comparing;
        if(comparing) {
            const comparedPokemons = state.compare.pokemons;
            if(includesPokemon(comparedPokemons, clickedPokemonData)) {
                comparedPokemons.splice(pokemonIndex(comparedPokemons,clickedPokemonData), 1);
            } else {
                comparedPokemons.push(clickedPokemonData);
            }
            state.compare = { ...state.compare, pokemons: comparedPokemons };
            if(comparedPokemons.length >= 2){
                $("#view-compare").css("display","block");
            } else {
                $("#view-compare").css("display", "none");
            }
        } else {
            state.view = { pokemon: clickedPokemonData };
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
    $("#stats").append(formatStatsForDisplay(pokemon));
    $("#types").html("");
    $("#types").append(formatTypesForDisplay(pokemon));
}


$(document).ready(function() {
    //Event for when the prev-btn is pressed to load a new set of pokemon
    $("#prev-btn").on("click", () => {
        loadPokemon(state.browse.prev);
        $("#prev-btn").css("display", "none");
        $("#next-btn").css("display", "none");
    });
    //Event for when the next-btn is pressed to load a new set of pokemon
    $("#next-btn").on("click", () => {
        loadPokemon(state.browse.next);
        $("#next-btn").css("display", "none");
        $("#prev-btn").css("display", "none");
    });
    //Event for when the back button is pressed when viewing a pokemon or comparing multiple ones
    $(".back-btn").on("click", () => {
        $("#viewer").css("display", "none");
        $("#comparer").css("display", "none");
        $(".favourite-icon").removeClass("icon-pressed");
        $("body").css("position", "relative");
        if(!state.compare.comparing) {
            $(".square").removeClass("square-pressed");
        }
    });
    //Event for when a heart icon is pressed to add pokemons to the favourite list and display a red heart when a pokemon has been favourited
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
    //Event to browse available pokemon when the logo on the navbar is pressed
    $("#logo").on("click", () => {
        state.compare = { pokemons: [], comparing: false };
        $('#compare').removeClass("compare-pressed");
        $("#view-compare").css("display", "none");
        displayPokemon();
        state.favourites.viewFavourites = false;
    });
    //Event to display the favourited pokemon to the page
    $("#favourites").on("click", () => {
        state.compare = { pokemons: [], comparing: false };
        state.favourites = {...state.favourites, viewFavourites: true};
        $("#view-compare").css("display", "none");
        $('#prev-btn').css("display", "none");
        $('#next-btn').css("display", "none");
        $('#compare').removeClass("compare-pressed");
        const pokemons = state.favourites.pokemons;
        displayPokemon(pokemons);
    });
    //Event to toggle the compare feature
    $("#compare").on("click", function() {
        if(state.compare.comparing) {
            state.compare = { pokemons: [], comparing: false}
        } else {
            state.compare = { pokemons: [], comparing: true};
        }
        $("#view-compare").css("display", "none");
        $(".square").removeClass("square-pressed");
        $(this).toggleClass("compare-pressed");
    });

    //Event to display the selected pokemon for comparison
    $("#view-compare").on("click", () => {
        const pokemons = state.compare.pokemons;
        $("#comparer-content").html("");
        for(let i = 0; i < pokemons.length; i++) {
            const pokemon = pokemons[i];
            const pokemonName = pokemon.name[0].toUpperCase() + pokemon.name.substring(1);
            let stats = formatStatsForDisplay(pokemon);
            let types = formatTypesForDisplay(pokemon);
            $("#comparer-content").append(`
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 bg-white d-flex flex-column align-items-center pokemon-compare">
                    <img class="view-img" src="${pokemon.sprites.front_default}">
                    <h1 id="name">${pokemonName}</h1>
                    <h3> 
                        Height 
                    </h3>
                    <p id="height">${pokemon.height}</p>
                    <h3>
                        Weight
                    </h3> 
                    <p id="weight">${pokemon.weight}</p>
                    <h3>
                        Stats
                    </h3>
                    <table id="stats">
                        ${stats}
                    </table>
                    <h3> 
                        Types 
                    </h3>
                    <table id="types">
                        ${types}
                    </table>
                </div>
            `);
        }
        $("#comparer").css("display", "block");
        $("body").css("position", "fixed");
    });
});

(function main(){
    loadPokemon("https://pokeapi.co/api/v2/pokemon");
}());

