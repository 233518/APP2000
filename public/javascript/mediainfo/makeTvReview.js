let postReview = document.getElementById('reviewPoster');
let reviewText = document.getElementById('reviewText');
let stars = document.getElementById('stars');
let reviewResult = document.getElementById('serieinfo-review-result');
let reviewForm = document.getElementById('serieinfo-review-form');


function lagObjekt() {
    console.log(userID);
    var objekt = {};
    objekt.tekst = reviewText.value;
    objekt.stars = stars.value;
    objekt.userId = userID;
    objekt.tvId = serie_Id;

    return objekt;
}

postReview.addEventListener("click", ()=>{
    console.log('Hei jeg er her ørjan!')
    socket.emit('makeATvReview', lagObjekt());
});

socket.on('makeTvReview_result', (result)=>{
    reviewResult.innerHTML=result.information;
    if (result.status){
        reviewForm.style.display='none';
    }
    
})