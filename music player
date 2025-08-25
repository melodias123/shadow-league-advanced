<!-- Embedded Music Tracks -->
<audio id="musicPlayer" autoplay loop></audio>

<script>
    // Base64 encoded MP3s (replace <BASE64_STRING> with your actual encoded audio)
    const musicTracks = [
        {name: 'Your Idol', data: 'data:audio/mp3;base64,<BASE64_YOUR_IDOL>'},
        {name: 'Soda Pop', data: 'data:audio/mp3;base64,<BASE64_SODA_POP>'},
        {name: 'Golden', data: 'data:audio/mp3;base64,<BASE64_GOLDEN>'}
    ];

    const player = document.getElementById('musicPlayer');
    let currentTrack = 0;

    function playTrack(index) {
        if(index >= musicTracks.length) index = 0;
        currentTrack = index;
        player.src = musicTracks[index].data;
        player.play();
    }

    // Play next track on end
    player.addEventListener('ended', () => {
        playTrack(currentTrack + 1);
    });

    // Start first track
    playTrack(0);
</script>
