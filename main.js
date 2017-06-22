let apikey = "d852a0ec23f62dadd3e6ed6411a8a8dc";

let searchBar = document.getElementById("searchbar");
let submitBtn = document.getElementById("submit");
let defaultStatus = document.getElementById("default-status");
let userResultsStatus = document.getElementById("user-results-status");
let trackResultsStatus = document.getElementById("track-results-status");
let userResultsTable = document.getElementsByClassName("user-results")[0];
let userResultsList = userResultsTable.getElementsByTagName("ul")[0];
let trackResultsTable = document.getElementsByClassName("track-results")[0];
let trackResultsList = trackResultsTable.getElementsByTagName("ul")[0];
let usersTabBtn = document.getElementById("user-results-btn");
let tracksTabBtn = document.getElementById("track-results-btn");

let audioElem = document.getElementsByTagName("audio")[0];
let nowPlayingStatus = document.getElementById("now-playing");


//Audio visualizer variables
let paused = true;
let ctx = new window.AudioContext(),
    audio = audioElem,
    audiosrc = null,
    analyzer = null,
    freqData = null,
    bufferLength = 0;

let visnodelist = [];

function renderFrame() {
    if (!paused && freqData != null) {
        setTimeout(function(){
            requestAnimationFrame(renderFrame);
        }, 1000 / 10);
        
        analyzer.getByteTimeDomainData(freqData);
        
        for (var i = 0; i < bufferLength; i++) {
            console.log(freqData[i]/128.0*100.0);
            let height = 100.0-(freqData[i]/128.0*100.0);
            let node = document.createElement("div");
            node.setAttribute("style", `background: #f1f1f1; position: relative; top: (${height+ '%'}; left: 2px; padding: 5px; z-index: 90;`);

            console.log("Creating element with style:");
            console.log(node.getAttribute("style"));
            
            nowPlayingStatus.appendChild(node);
        }

        analyzer.getByteFrequencyData(freqData);
        
    }
}

function startVisualizer() {
    console.log("Starting visualizer");
    audioElem.crossOrigin = "anonymous";
    audiosrc = ctx.createMediaElementSource(audioElem);
    analyzer = ctx.createAnalyser();
    analyzer.fftSize = 2048;
    
    audiosrc.connect(analyzer);
    
    bufferLength = analyzer.fftSize;

    freqData = new Uint8Array(analyzer.fftSize);
    
    console.dir(freqData);
    
    analyzer.getByteTimeDomainData(freqData);

    audio.play();
    //renderFrame();

}

function playAudio(task, src_url, title) {
    audioElem.setAttribute("src", src_url);
    if (task == 'play') {
        audioElem.play();
        nowPlayingStatus.innerHTML = title;
        paused = false;
        //startVisualizer();
    } else if (task == 'pause') {
        audioElem.pause();
        paused = true;
    }

}

function formatQuery(query) {
    let result = query.trim();
    while (result.includes(" ")) {
        result = result.replace(" ", "+");
    }
    return result;
}

function truncate(string, length) {
    let result = string;
    if (result == null) return " ";
    if (result.length > length) {
        result = result.substr(0, length);
        result += "...";
    }

    return result;
}

function fillNullVals(json_obj) {
    let result = json_obj;
    for (var key in json_obj) {
        //Make sure key is not from obj prototype
        if (json_obj.hasOwnProperty(key)) {
            if (json_obj[key] == null || json_obj[key].toString().trim() == "") {
                switch (key) {
                    case "genre":
                        result["genre"] = "Unclassified";
                        break;
                    case "desc":
                        result["desc"] = "No description available.";
                        break;
                    case "name":
                        result["name"] = "&nbsp;";
                        break;
                    case "artwork":
                        result["artwork"] = result["avatar"];
                        break;
                }
            }
        }
    }

    return result;
}

function submit(query) {


    let cleanquery = formatQuery(query);
    console.log(`Fetching https://api.soundcloud.com/users/?client_id=${apikey}&q=${cleanquery}`);

    /*==============================================*/
    /* ------- User Results Query Handler --------- */
    /*==============================================*/

    //Hide default status text
    defaultStatus.style.display = "none";

    //Make user results status text visible
    userResultsStatus.style.visibility = "visible";

    //Search and display returned users in userresultslist
    fetch(`https://api.soundcloud.com/users/?client_id=${apikey}&q=${cleanquery}`)
        .then(function (response) {
            if (response.status != 200) {
                console.error(`Error: Query to soundcloud api returned a status of ${response.status}, message: ${response.responseText}`);
                userResultsStatus.innerHTML = "Error fetching user results, check the browser console for more details.";
                trackResultsStatus.innerHTML = userResultsStatus.innerHTML;
                return;
            } else {
                response.json().then(function (results) {

                    if (results.length == 0 || results == []) {
                        userResultsStatus.innerHTML = "No users found matching that query.";
                        return;
                    } else {
                        userResultsStatus.innerHTML = `Search returned ${results.length} results in users.`;
                    }

                    //Clear all previous results
                    userResultsList.innerHTML = "";

                    //Create and append an li node to userresultslist for each result returned
                    for (var i = 0; i < results.length; i++) {
                        let newli = document.createElement("li");
                        let data = {
                            "avatar": results[i].avatar_url,
                            "uname": truncate(results[i].username, 15),
                            "name": truncate(results[i].full_name, 28),
                            "desc": truncate(results[i].description, 50),
                            "link": results[i].permalink_url,
                            "displink": truncate(results[i].permalink_url, 10),
                            "trackct": results[i].track_count,
                            "followerct": results[i].followers_count,
                        }

                        data = fillNullVals(data);

                        newli.innerHTML = `
                            <div class="user-name">
                                <div class="avatar">
                                    <img src="${data.avatar}">
                                </div>
                                <div class="beside-avatar">
                                    <span class="uname"><i class="fa fa-user-circle-o"></i><a href="${data.link}" target="_blank">${data.uname}</a></span>
                                    <span class="name">${data.name}</span>
                                    <span class="trackct"><i class="fa fa-music"></i>${data.trackct}</span>
                                    <span class="followerct"><i class="fa fa-users"></i>${data.followerct}</span>
                                </div>
                            </div>
                            <div class="user-bottom">
                                <span class="desc">${data.desc}</span>
                            </div>`;

                        userResultsList.appendChild(newli);

                    }
                });
            }
        });



    /*==============================================*/
    /* ------- Track Results Query Handler -------- */
    /*==============================================*/

    console.log(`Fetching https://api.soundcloud.com/tracks?client_id=${apikey}&q=${cleanquery}`);

    //Search and display returned tracks in trackresultslist
    fetch(`https://api.soundcloud.com/tracks?client_id=${apikey}&q=${cleanquery}`)
        .then(function (response) {
            if (response.status != 200) {
                console.error(`Error: Query to soundcloud api returned a status of ${response.status}, message: ${response.responseText}`);
                userResultsStatus.innerHTML = "Error fetching user results, check the browser console for more details.";
                trackResultsStatus.innerHTML = userResultsStatus.innerHTML;
                return;
            } else {
                response.json().then(function (results) {

                    if (results.length == 0 || results == []) {
                        trackResultsStatus.innerHTML = "No tracks found matching that query.";
                        return;
                    } else {
                        trackResultsStatus.innerHTML = `Search returned ${results.length} results in tracks.`;
                    }

                    //Clear all previous results
                    trackResultsList.innerHTML = "";

                    //Create and append an li node to userresultslist for each result returned
                    for (var i = 0; i < results.length; i++) {
                        let newli = document.createElement("li");
                        let data = {
                            "avatar": results[i].user.avatar_url,
                            "artwork": results[i].artwork_url,
                            "uname": results[i].user.username,
                            "title": results[i].title,
                            "desc": truncate(results[i].description, 150),
                            "user_link": results[i].user.permalink_url,
                            "playct": results[i].playback_count,
                            "genre": results[i].genre,
                            "audio_src": results[i].stream_url,
                        }

                        data = fillNullVals(data);

                        newli.innerHTML = `
                        <div class="trackimg">
                            <img src="${data.artwork}">
                        </div>
                        <div class="beside-trackimg">
                            <span class="uname"><i class="fa fa-user-circle-o"></i>${data.uname}</span>
                            <span class="genre">${data.genre}</span>
                            <span class="playct"><i class="fa fa-headphones"></i>${data.playct}</span>
                            <span class="name"><a class="playbtn" audiosrc="${data.audio_src}?client_id=${apikey}" href="#"><i class="fa fa-play-circle"></i>${data.title}</a></span>
                            <div class="track-bottom">
                                <span class="title
                                <span class="desc">${data.desc}</span>
                                <p class="clicktoplay">Click to Play</p>
                            </div>
                        </div>`;

                        trackResultsList.appendChild(newli);

                    }

                });
            }
        });

}

submitBtn.addEventListener("click", function (event) {
    let query = searchBar.value;
    if (query.length > 0) {
        submit(query);
    }
});

searchBar.addEventListener("keypress", function (event) {
    if (event.keyCode == 13) {
        let query = searchBar.value;
        if (query.length > 0) {
            submit(query);
        }
    }
});

usersTabBtn.addEventListener('click', function () {
    if (!usersTabBtn.classList.contains("selected")) {
        tracksTabBtn.classList = [];
        usersTabBtn.classList = ["selected"];
        userResultsList.style.visibility = "visible";
        trackResultsList.style.visibility = "hidden";
        userResultsStatus.style.visibility = "visible";
        trackResultsStatus.style.visibility = "hidden";
    }
})

tracksTabBtn.addEventListener('click', function () {
    if (!tracksTabBtn.classList.contains("selected")) {
        usersTabBtn.classList = [];
        tracksTabBtn.classList = ["selected"];
        userResultsList.style.visibility = "hidden";
        trackResultsList.style.visibility = "visible";
        userResultsStatus.style.visibility = "hidden";
        trackResultsStatus.style.visibility = "visible";
    }
})

document.querySelector("body").addEventListener('click', function (event) {
    if (event.target.classList.contains("playbtn")) {
        let src = event.target.getAttribute("audiosrc");
        let title = event.target.innerHTML.replace(`<i class="fa fa-play-circle"></i>`, '');
        playAudio("play", src, title);
    }
})


// 5. Create a way to listen for a click that will play the track in the audio play
