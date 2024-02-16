const APIController = (function() {
    
    const clientId = "8a845aa67d4348ae98f84d305787b9ac";
    const clientSecret = "19bee4aa7a894e17b91df7a0e61c5222";

    // private methods
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }
    
    const _getCategories = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?limit=50`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token},
        });

        const data = await result.json();
        console.log("Categories: ")
        console.log(data);
        return data.categories.items;
    }

    const _getPlaylistsByCategory = async (token,category_id) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${category_id}/playlists`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token},
        });

        const data = await result.json();
        console.log("Category's Playlists: ")
        console.log(data);
        return data.playlists.items;
    }

    const _getTracksByPlaylist = async (token,playlist_id) => {

        const result = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token},
        });

        const data = await result.json();
        console.log("Playlist's Tracks: ")
        console.log(data);
        return data.tracks.items;
    }

    const _getTrack = async (token,track_id) => {

        const result = await fetch(`https://api.spotify.com/v1/tracks/${track_id}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token},
        });

        const data = await result.json();
        console.log("Track: ")
        console.log(data);
        return data;
    }

    const _getTrackLyrics = async (token,track_id) => {
        const result = await fetch(`` , {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token,
                        'app-platform': 'WebPlayer'   },
        });

        const data = await result.json();
        console.log("TrackLyrics: ")
        console.log(data);
        return data;
    }


    return {
        getToken() {
            return _getToken();
        },
        getCategories(token) {
            return _getCategories(token);
        },
        getPlaylistsByCategory(token, id) {
            return _getPlaylistsByCategory(token, id);
        },
        getTracksByPlaylist(token, id) {
            return _getTracksByPlaylist(token, id);
        },
        getTrack(token, id) {
            return _getTrack(token, id);
        },
        getTrackLyrics(token, id) {
            return _getTrackLyrics(token, id);
        }
    }
})();


// UI Module
const UIController = (function() {

    //object to hold references to html selectors
    const DOMElements = {
        selectCategories: '#select_categories',
        selectPlaylistsByCategory: '#select_playlists_by_category',
        selectTracksByPlaylist: '#select_tracks_by_playlist',
        audioTrack: '.audio-track',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
    }

    //public methods
    return {

        //method to get input fields
        inputField() {
            return {
                categories: document.querySelector(DOMElements.selectCategories),
                playlistsbycategory: document.querySelector(DOMElements.selectPlaylistsByCategory),
                tracksbyplaylist: document.querySelector(DOMElements.selectTracksByPlaylist),
                audioTrack: document.querySelector(DOMElements.audioTrack),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // need methods to create select list option
        createCategories(name, id) {
            const html = `<option value="${id}">${name}</option>`;
            document.querySelector(DOMElements.selectCategories).insertAdjacentHTML('beforeend', html);
        }, 

        // need methods to create select list option
        createPlaylistsByCategory(name, id) {
            const html = `<option value="${id}">${name}</option>`;
            document.querySelector(DOMElements.selectPlaylistsByCategory).insertAdjacentHTML('beforeend', html);
        }, 

        // need methods to create select list option
        createTracksByPlaylist(name, id, url) {
            // console.log(name,url)
            if(url==null) return;

            const html = `<option value="${id}">${name}</option>`;
            
            document.querySelector(DOMElements.selectTracksByPlaylist).insertAdjacentHTML('beforeend', html);
        },

        createTrack(track_id, name, img, artists, url, duration) {
            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            // any time user clicks a new song, we need to clear out the song detail div
            detailDiv.innerHTML = '';

            const html = 
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${name}:</label>
            </div>
            `
            ;

            let artistsList = '';
            artists.forEach(artist => {
                artistsList += `<div id=${artist.id} class="row col-sm-12 px-0">
                    <label for="artist" class="form-label col-sm-12">By ${artist.name}</label>
                </div>`
            });

            const audioHtml = 
            `
            <audio class="audio-track" id = ${track_id} controls autoplay>
                <source src="${url}" type="audio/ogg">
            </audio>
            `;

            detailDiv.insertAdjacentHTML('beforeend', html+artistsList+audioHtml);
        },

        resetPlaylistsByCategory() {
            this.inputField().playlistsbycategory.innerHTML = `<option>Select...</option>`;
            if(this.inputField().audioTrack)
                this.inputField().audioTrack.innerHTML = '';
            this.resetTracksByPlaylist();
        },

        resetTracksByPlaylist() {
            this.inputField().tracksbyplaylist.innerHTML = `<option>Select...</option>`;
        },

        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {

    // get input field object ref
    const DOMInputs = UICtrl.inputField();

    // get categories on page load
    const loadCategories = async () => {
        //get the token
        const token = await APICtrl.getToken();           
        //store the token onto the page
        UICtrl.storeToken(token);
        //get the categories
        const categories = await APICtrl.getCategories(token);
        //populate our categories select element
        categories.forEach(category => UICtrl.createCategories(category.name, category.id));
    }

    // create categories change event listener
    DOMInputs.categories.addEventListener('change', async () => {
        //reset the playlist
        UICtrl.resetPlaylistsByCategory();
        //get the token that's stored on the page
        const token = UICtrl.getStoredToken().token;        
        // get the category select field
        const categorySelect = DOMInputs.categories;
        // get the category id associated with the selected category
        const categoryId = categorySelect.options[categorySelect.selectedIndex].value;             
        // ge the playlist based on a category
        const playlists = await APICtrl.getPlaylistsByCategory(token, categoryId);       
        // create a playlist list item for every playlist returned
        playlists.forEach(playlist => UICtrl.createPlaylistsByCategory(playlist.name, playlist.id));
    });
     
    // create playlists change event listener
    DOMInputs.playlistsbycategory.addEventListener('change', async () => {
        //reset the playlist
        UICtrl.resetTracksByPlaylist();
        //get the token that's stored on the page
        const token = UICtrl.getStoredToken().token;        
        // get the playlist select field
        const playlistbycategorySelect = DOMInputs.playlistsbycategory;
        // get the playlist id associated with the selected category
        const playlistId = playlistbycategorySelect.options[playlistbycategorySelect.selectedIndex].value;         
        // ge the tracks based on a playlist
        const tracks = await APICtrl.getTracksByPlaylist(token, playlistId);       
        // create a track list item for every playlist returned
        tracks.forEach(track => UICtrl.createTracksByPlaylist(track.track.name, track.track.id, track.track.preview_url));
    });

    // create tracks change event listener
    DOMInputs.tracksbyplaylist.addEventListener('change', async () => {
        //reset the playlist
        // UICtrl.resetPlaylist();
        //get the token that's stored on the page
        const token = UICtrl.getStoredToken().token;        
        // get the track select field
        const trackbyplaylistSelect = DOMInputs.tracksbyplaylist;
        // get the track id associated with the selected track
        const trackId = trackbyplaylistSelect.options[trackbyplaylistSelect.selectedIndex].value;
        // ge the track
        const track = await APICtrl.getTrack(token, trackId);
        // const tracklyrics = await APICtrl.getTrackLyrics(token, trackId);
    
        UICtrl.createTrack(track.id, track.name, track.album.images[0].url, track.artists, track.preview_url, track.duration_ms/1000+1);

    });
     

    return {
        init() {
            console.log('App is starting');
            loadCategories();
        }
    }

})(UIController, APIController);

// will need to call a method to load the genres on page load
APPController.init();



/*
module named APPController is defined using an immediately-invoked function expression (IIFE). 
The IIFE takes two parameters, UICtrl and APICtrl, which are expected to be references to other modules or objects. 
Function 'loadGenres()' is either defined within the module or accessible 
through one of the injected dependencies (UIController or APIController).
The 'UICtrl' parameter inside the module will reference the object passed as UIController, and similarly for 'APICtrl' to APIController.
Module is defined and instantiated, the init method of APPController is called. This is the entry point for starting the application.
*/