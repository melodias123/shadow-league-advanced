// --- Game State ---
class GameState {
    constructor() {
        this.currentScreen = 'faction';
        this.player = {
            x: 400,
            y: 300,
            width: 30,
            height: 30,
            speed: 5,
            hp: 100,
            maxHp: 100,
            xp: 0,
            level: 1,
            faction: '',
            abilities: [],
            cooldowns: {},
            invulnerable: false
        };
        this.currentRealm = 'shadow';
        this.fruits = [];
        this.bosses = [];
        this.particles = [];
        this.keys = {};
        this.lastFruitSpawn = 0;
        this.lastBossSpawn = 0;

        // Music playlist
        this.musicTracks = ['Your Idol.mp3', 'Soda Pop.mp3', 'Golden.mp3'];
        this.currentTrackIndex = 0;
    }
}

// --- Game Engine ---
class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.state = new GameState();
        this.setupEventListeners();
        this.initMusic();
        this.gameLoop();

        // Spawning
        setInterval(() => this.spawnFruit(), 5000);
        setInterval(() => this.spawnBoss(), 15000);
    }

    // --- Music ---
    initMusic() {
        this.bgMusic = document.getElementById('bgMusic');
        this.bgMusic.src = this.state.musicTracks[this.state.currentTrackIndex];
        this.bgMusic.play();
        this.bgMusic.addEventListener('ended', () => {
            this.state.currentTrackIndex = (this.state.currentTrackIndex + 1) % this.state.musicTracks.length;
            this.bgMusic.src = this.state.musicTracks[this.state.currentTrackIndex];
            this.bgMusic.play();
        });
    }

    // --- Event Listeners ---
    setupEventListeners() {
        document.querySelectorAll('.faction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const faction = e.target.id.replace('Faction','').toLowerCase();
                this.selectFaction(faction);
            });
        });

        document.querySelectorAll('#gameScreen [id$="Realm"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const realm = e.target.id.replace('Realm','').toLowerCase();
                this.switchRealm(realm);
            });
        });

        document.querySelectorAll('.ability-btn').forEach((btn,index) => {
            btn.addEventListener('click', () => this.useAbility(index+1));
        });

        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        document.addEventListener('keydown', (e) => {
            this.state.keys[e.key.toLowerCase()] = true;
            if(e.key >= '1' && e.key <= '3') this.useAbility(parseInt(e.key));
        });

        document.addEventListener('keyup', (e) => { this.state.keys[e.key.toLowerCase()] = false; });

        this.canvas.addEventListener('click', (e) => {
            if(this.state.currentScreen === 'game') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.castAbilityAt(x,y);
            }
        });
    }

    // --- Faction & Realm ---
    selectFaction(faction) {
        this.state.player.faction = faction;
        this.state.player.abilities = this.getFactionAbilities(faction);
        document.getElementById('currentFaction').textContent = this.getFactionName(faction);

        document.getElementById('factionScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        this.state.currentScreen = 'game';
        this.switchRealm(faction);
    }

    getFactionName(faction) {
        const names = { shadow:'Shadow League', claw:'C.L.A.W', light:'Lightly City', space:'SpaceX Station' };
        return names[faction] || faction;
    }

    getFactionAbilities(faction) {
        const abilities = {
            shadow:['Shadow Strike','Dark Shield','Shadow Heal'],
            claw:['Claw Strike','Rage Mode','Blood Heal'],
            light:['Light Beam','Holy Shield','Divine Heal'],
            space:['Plasma Shot','Energy Shield','Nano Heal']
        };
        return abilities[faction] || abilities['shadow'];
    }

    switchRealm(realm) {
        this.state.currentRealm = realm;
        this.state.fruits = [];
        this.state.bosses = [];
        this.state.particles = [];

        const realmColors = {
            shadow:'linear-gradient(135deg,#2d1b69 0%,#11054c 100%)',
            claw:'linear-gradient(135deg,#8b0000 0%,#4b0000 100%)',
            light:'linear-gradient(135deg,#ffd700 0%,#ff8c00 100%)',
            space:'linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)'
        };
        this.canvas.style.background = realmColors[realm] || realmColors['shadow'];
    }

    // --- Spawn ---
    spawnFruit() {
        if(this.state.currentScreen !== 'game') return;
        const fruit = { x: Math.random()*(this.canvas.width-30), y: Math.random()*(this.canvas.height-30), width:15, height:15, type:this.state.currentRealm, collected:false };
        this.state.fruits.push(fruit);
    }

    spawnBoss() {
        if(this.state.currentScreen !== 'game' || this.state.bosses.length>0) return;
        const boss = { x:Math.random()*(this.canvas.width-60), y:Math.random()*(this.canvas.height-60), width:40, height:40, hp:200, maxHp:200, speed:2, type:this.state.currentRealm, lastAttack:0, target:this.state.player };
        this.state.bosses.push(boss);
    }

    // --- Abilities ---
    useAbility(index) {
        const name = this.state.player.abilities[index-1];
        if(!name || this.state.player.cooldowns[name]) return;
        this.state.player.cooldowns[name] = Date.now()+3000;

        switch(name){
            case 'Shadow Strike': case 'Claw Strike': case 'Light Beam': case 'Plasma Shot': this.attackAbility(name); break;
            case 'Dark Shield': case 'Rage Mode': case 'Holy Shield': case 'Energy Shield': this.shieldAbility(name); break;
            case 'Shadow Heal': case 'Blood Heal': case 'Divine Heal': case 'Nano Heal': this.healAbility(name); break;
        }
        this.updateCooldownUI(index);
    }

    attackAbility(name) {
        this.state.bosses.forEach(boss=>{
            const dx=boss.x-this.state.player.x, dy=boss.y-this.state.player.y, dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<100){ boss.hp-=50; this.createParticleEffect(boss.x+boss.width/2, boss.y+boss.height/2,'attack'); }
        });
    }

    shieldAbility(name) {
        this.state.player.invulnerable=true;
        setTimeout(()=>this.state.player.invulnerable=false,2000);
        this.createParticleEffect(this.state.player.x,this.state.player.y,'shield');
    }

    healAbility(name) {
        this.state.player.hp=Math.min(this.state.player.maxHp,this.state.player.hp+30);
        this.updateUI();
        this.createParticleEffect(this.state.player.x,this.state.player.y,'heal');
    }

    castAbilityAt(x,y){ this.createParticleEffect(x,y,'cast'); }

    updateCooldownUI(index){
        const el=document.querySelector(`#ability${index} .ability-cooldown`);
        el.classList.remove('hidden');
        setTimeout(()=>el.classList.add('hidden'),3000);
    }

    // --- Particle Effects ---
    createParticleEffect(x,y,type){
        const count=type==='attack'?15:8;
        for(let i=0;i<count;i++){
            const p={x,y,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,life:1,decay:0.02,size:Math.random()*5+2,type,faction:this.state.currentRealm};
            this.state.particles.push(p);
        }
    }

    // --- Player & Collision ---
    updatePlayer(){
        if(this.state.keys['w']||this.state.keys['arrowup']) this.state.player.y=Math.max(0,this.state.player.y-this.state.player.speed);
        if(this.state.keys['s']||this.state.keys['arrowdown']) this.state.player.y=Math.min(this.canvas.height-this.state.player.height,this.state.player.y+this.state.player.speed);
        if(this.state.keys['a']||this.state.keys['arrowleft']) this.state.player.x=Math.max(0,this.state.player.x-this.state.player.speed);
        if(this.state.keys['d']||this.state.keys['arrowright']) this.state.player.x=Math.min(this.canvas.width-this.state.player.width,this.state.player.x+this.state.player.speed);
    }

    updateFruits() {
        this.state.fruits=this.state.fruits.filter(fruit=>{
            if(this.checkCollision(this.state.player,fruit)){
                this.state.player.xp+=25;
                this.checkLevelUp();
                this.createParticleEffect(fruit.x,fruit.y,'collect');
                return false;
            }
            return true;
        });
    }

    updateBosses(){
        this.state.bosses=this.state.bosses.filter(boss=>{
            if(boss.hp<=0){ this.state.player.xp+=100; this.checkLevelUp(); this.createParticleEffect(boss.x+boss.width/2,boss.y+boss.height/2,'victory'); return false; }

            const dx=this.state.player.x-boss.x, dy=this.state.player.y-boss.y, dist=Math.sqrt(dx*dx+dy*dy);
            if(dist>0){ boss.x+=(dx/dist)*boss.speed; boss.y+=(dy/dist)*boss.speed; }
            if(dist<30 && Date.now()-boss.lastAttack>1000){ if(!this.state.player.invulnerable){ this.state.player.hp-=15; this.createParticleEffect(this.state.player.x,this.state.player.y,'damage'); } boss.lastAttack=Date.now(); }
            return true;
        });
    }

    updateParticles(){
        this.state.particles=this.state.particles.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.life-=p.decay; p.vx*=0.98; p.vy*=0.98; return p.life>0; });
    }

    checkCollision(a,b){ return a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y; }

    checkLevelUp(){
        const req=this.state.player.level*100;
        if(this.state.player.xp>=req){ this.state.player.xp-=req; this.state.player.level++; this.state.player.maxHp+=20; this.state.player.hp=this.state.player.maxHp; }
        this.updateUI();
    }

    updateUI(){
        document.getElementById('playerLevel').textContent=`Level ${this.state.player.level}`;
        document.getElementById('hpText').textContent=`${this.state.player.hp}/${this.state.player.maxHp}`;
        document.getElementById('xpText').textContent=`${this.state.player.xp}/${this.state.player.level*100}`;
        document.getElementById('hpBar').style.width=`${(this.state.player.hp/this.state.player.maxHp)*100}%`;
        document.getElementById('xpBar').style.width=`${(this.state.player.xp/(this.state.player.level*100))*100}%`;
        if(this.state.player.hp<=0) this.gameOver();
    }

    gameOver(){
        this.state.currentScreen='gameOver';
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    restartGame(){
        this.state=new GameState();
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('factionScreen').classList.remove('hidden');
        this.initMusic();
    }

    // --- Render ---
    render(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        if(this.state.currentScreen!=='game') return;

        // Particles
        this.state.particles.forEach(p=>{
            this.ctx.save();
            this.ctx.globalAlpha=p.life;
            const colors={
                shadow:{attack:'#8b00ff',shield:'#4b0082',heal:'#32cd32',collect:'#ffd700',damage:'#ff0000',victory:'#00ff00',cast:'#9370db'},
                claw:{attack:'#dc143c',shield:'#b22222',heal:'#32cd32',collect:'#ffd700',damage:'#ff0000',victory:'#00ff00',cast:'#dc143c'},
                light:{attack:'#ffd700',shield:'#ffff00',heal:'#32cd32',collect:'#ffd700',damage:'#ff0000',victory:'#00ff00',cast:'#ffd700'},
                space:{attack:'#8a2be2',shield:'#4b0082',heal:'#32cd32',collect:'#ffd700',damage:'#ff0000',victory:'#00ff00',cast:'#8a2be2'}
            };
            this.ctx.fillStyle=colors[p.faction][p.type]||'#fff';
            this.ctx.beginPath();
            this.ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Fruits
        this.state.fruits.forEach(f=>{
            const c={shadow:'#8b00ff',claw:'#dc143c',light:'#ffd700',space:'#8a2be2'};
            this.ctx.fillStyle=c[f.type]||'#fff';
            this.ctx.fillRect(f.x,f.y,f.width,f.height);
            this.ctx.shadowColor=c[f.type];
            this.ctx.shadowBlur=10;
            this.ctx.fillRect(f.x,f.y,f.width,f.height);
            this.ctx.shadowBlur=0;
        });

        // Player
        this.ctx.save();
        if(this.state.player.invulnerable) this.ctx.globalAlpha=0.5+0.5*Math.sin(Date.now()*0.01);
        const pc={shadow:'#4b0082',claw:'#8b0000',light:'#ff8c00',space:'#1e3c72'};
        this.ctx.fillStyle=pc[this.state.player.faction]||'#0066cc';
        this.ctx.fillRect(this.state.player.x,this.state.player.y,this.state.player.width,this.state.player.height);
        this.ctx.restore();

        // Bosses
        this.state.bosses.forEach(b=>{
            const c={shadow:'#2f1b14',claw:'#4b0000',light:'#ff4500',space:'#191970'};
            this.ctx.fillStyle=c[b.type]||'#333';
            this.ctx.fillRect(b.x,b.y,b.width,b.height);
            const hpPercent=b.hp/b.maxHp;
            this.ctx.fillStyle='rgba(255,0,0,0.8)';
            this.ctx.fillRect(b.x,b.y-8,b.width,4);
            this.ctx.fillStyle='rgba(0,255,0,0.8)';
            this.ctx.fillRect(b.x,b.y-8,b.width*hpPercent,4);
        });
    }

    // --- Main Loop ---
    gameLoop(){
        if(this.state.currentScreen==='game'){
            this.updatePlayer();
            this.updateFruits();
            this.updateBosses();
            this.updateParticles();
            this.render();
        }
        requestAnimationFrame(()=>this.gameLoop());
    }
}

// --- Start Game ---
window.addEventListener('load',()=>{ new Game(); });
