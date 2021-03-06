let postsToShowOnClick = 16;
let lastDisplayedPost = 16;
var loadMore = document.getElementById('loadMore');
var noMoreMedia = document.getElementById('noMoreMedia');
var url = url;
var urlPath = urlPath;
/**
 * Henter hvilken type sortering brukeren skal ha og sender videre til socket
 * @author Ørjan Dybevik - 233530
 */
document.querySelectorAll('.tv-shows-filter-list ul a').forEach(item => {
    item.addEventListener('click', event => {
        socket.emit(item.id, popularMedia);
    })
});

/**
 * Henter hvilken type sortering brukeren skal ha og sender videre til socket
 * @author Ørjan Dybevik - 233530
 */
document.querySelectorAll('.movies-filter-list ul a').forEach(item => {
    item.addEventListener('click', event => {
        socket.emit(item.id, popularMedia);
    })
});

/**
 * Henter hvilken type sjanger brukeren vil sortere etter og sender videre til socket
 * @author Ørjan Dybevik - 233530
 */
document.querySelectorAll('.media-genre-list ul a').forEach(item => {
    item.addEventListener('click', event => {
        socket.emit('filterByGenre', {arr: popularMedia, genreId: item.id});
    })
});

/**
 * Viser de 16 første filmene/seriene
 * @author Ørjan Dybevik - 233530
 */
socket.on('displayFilteredMedia', function(args){
    currentMediaDisplayed = args;
    document.getElementById('mediaCard').innerHTML = "";
    for(let i = 0; i < 16; i++){
        document.getElementById('mediaCard').innerHTML += mediaCard(args[i]);
    }
    postsToShowOnClick = 16;
    lastDisplayedPost = 16;
    loadMore.style.display = 'block';
    noMoreMedia.style.display = 'none';
});

/**
 * Lager HTML for hver film/serie som skal vises
 * @param {Object} data Data som skal vises i kortet
 * @returns HTML
 * @author Ørjan Dybevik - 233530
 */
function mediaCard(data){
    return `<a href='/${urlPath}/${url}/${data.id}'
            <div class='uk-card uk-card-default upcoming-card-padding anchor-remove-text-decoration'>
            <div class='uk-card-media-top'><img src=https:\\\\www.themoviedb.org\\t\\p\\w600_and_h900_bestv2\\${data.pictureUrl} onerror="this.onerror=null; this.src='/images/filmatory_default_poster.png'" alt=''></div>
            <div class='uk-card-body uk-text-center'><h3 class='uk-card-title'>${data.title}</h3><p class='uk-position-bottom uk-margin-bottom uk-text-bold'>${data.releaseDate}</p></div></div></a>`
}

/**
 * Knapp for å loade 16 filmer om gangen
 * @param {Object} media Array med filmer/serier
 * @param {event} e event
 * @author Ørjan Dybevik - 233530
 */
function load(media, e){
    e.preventDefault();
    if(media.length - lastDisplayedPost < 16){
        postsToShowOnClick = media.length - lastDisplayedPost
        for (let i = lastDisplayedPost; i < postsToShowOnClick + lastDisplayedPost; i++) {
        document.getElementById('mediaCard').innerHTML += mediaCard(media[i]);
        }
        lastDisplayedPost = lastDisplayedPost + postsToShowOnClick;
        if(postsToShowOnClick == 0){
            loadMore.style.display = 'none';
            noMoreMedia.style.display = 'block';
        }
    } else {
        for (let i = lastDisplayedPost; i < lastDisplayedPost + postsToShowOnClick; i++) {
        document.getElementById('mediaCard').innerHTML += mediaCard(media[i]);
        } 

        lastDisplayedPost = lastDisplayedPost + postsToShowOnClick;
    }
}
