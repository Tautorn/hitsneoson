// NeoSon Hits Volume 2 - Proibidão - Music Player
class NeoSonPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progress = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.trackTitle = document.querySelector('.track-title');
        
        // Lista de faixas - você pode adicionar suas músicas aqui
        this.tracks = [
            // Adicione suas músicas aqui no formato:
            {
                title: "Schu Passeios sem Motor",
                file: "Schu Passeios sem Motor.mp3",
                duration: "2:04"
            },
            {
                title: "Saveiro pega no BREU",
                file: "Saveiro pega no BREU.mp3",
                duration: "2:04"
            },
            {
                title: "Amante Giletão - Leno Brega",
                file: "Amante Giletão - Leno Brega.mp3",
                duration: "2:04"
            },
        ];
        
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        if (this.tracks.length > 0) {
            this.loadTrack(this.currentTrackIndex);
        }
        this.updateTrackList();
        
        // Tentar auto-play quando a página carrega
        if (this.tracks.length > 0) {
            this.attemptAutoPlay();
        }
    }
    
    setupEventListeners() {
        // Controles do player
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Barra de progresso
        const progressBar = document.querySelector('.progress-bar');
        progressBar.addEventListener('click', (e) => this.seekTo(e));
        
        // Controle de volume
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Eventos do áudio
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        this.audio.addEventListener('error', (e) => this.handleError(e));
        this.audio.addEventListener('canplaythrough', () => {
            // Toca automaticamente quando o áudio estiver pronto
            if (this.currentTrackIndex === 0 && this.tracks.length > 0) {
                this.attemptAutoPlay();
            }
        });
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Permitir reprodução após primeira interação do usuário
        document.addEventListener('click', () => this.enableAudio(), { once: true });
        document.addEventListener('touchstart', () => this.enableAudio(), { once: true });
        
        // Efeitos visuais
        this.setupVisualEffects();
    }
    
    loadTrack(index) {
        if (this.tracks.length === 0) {
            this.trackTitle.textContent = 'Adicione músicas na lista';
            return;
        }
        
        if (index >= 0 && index < this.tracks.length) {
            this.currentTrackIndex = index;
            const track = this.tracks[index];
            
            this.audio.src = track.file;
            this.audio.load(); // Força o carregamento do áudio
            this.trackTitle.textContent = track.title;
            this.updateActiveTrack();
            
            // Efeito visual ao trocar de faixa
            this.animateTrackChange();
            
            // Verifica se o arquivo foi carregado corretamente
            this.audio.addEventListener('error', (e) => {
                console.error('Erro ao carregar arquivo de áudio:', e);
                this.showNotification('Erro ao carregar o arquivo de música');
            }, { once: true });
        }
    }
    
    enableAudio() {
        // Habilita o contexto de áudio após interação do usuário
        if (this.audio.context && this.audio.context.state === 'suspended') {
            this.audio.context.resume();
        }
        // Remove o muted para permitir reprodução com som
        this.audio.muted = false;
    }
    
    attemptAutoPlay() {
        if (this.tracks.length === 0) return;
        
        // Aguarda um pouco para garantir que o áudio esteja carregado
        setTimeout(() => {
            // Tenta reproduzir com muted primeiro (permitido pelos navegadores)
            this.audio.muted = true;
            this.play().then(() => {
                // Se funcionou, remove o muted após um tempo
                setTimeout(() => {
                    this.audio.muted = false;
                }, 1000);
            }).catch(error => {
                console.log('Auto-play bloqueado pelo navegador, aguardando interação do usuário');
                this.showNotification('Clique em play para iniciar a música');
            });
        }, 1500);
    }
    
    play() {
        if (this.tracks.length === 0) {
            this.showNotification('Adicione músicas na lista');
            return Promise.reject('No tracks');
        }
        
        return this.audio.play().then(() => {
            this.isPlaying = true;
            this.playPauseBtn.textContent = '⏸';
            this.animatePlayButton();
        }).catch(error => {
            console.error('Erro ao reproduzir:', error);
            this.isPlaying = false;
            this.playPauseBtn.textContent = '▶';
            
            // Se for erro de autoplay, mostra mensagem específica
            if (error.name === 'NotAllowedError') {
                this.showNotification('Clique em play para iniciar a música');
            } else {
                this.showNotification('Erro ao reproduzir a música');
            }
            throw error; // Re-throw para permitir tratamento adicional
        });
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    previousTrack() {
        if (this.tracks.length === 0) return;
        
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = this.tracks.length - 1;
        }
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    nextTrack() {
        if (this.tracks.length === 0) return;
        
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.tracks.length) {
            newIndex = 0;
        }
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    selectTrack(index) {
        if (this.tracks.length === 0) return;
        
        this.loadTrack(index);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    seekTo(e) {
        if (this.tracks.length === 0 || !this.audio.duration) return;
        
        const progressBar = document.querySelector('.progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.audio.duration;
        
        this.audio.currentTime = newTime;
        this.updateProgress();
    }
    
    setVolume(value) {
        this.audio.volume = value / 100;
        
        // Efeito visual no controle de volume
        const volumeIcon = document.querySelector('.volume-control span');
        if (value == 0) {
            volumeIcon.textContent = '🔇';
        } else if (value < 30) {
            volumeIcon.textContent = '🔈';
        } else if (value < 70) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const percentage = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = percentage + '%';
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    onTrackEnd() {
        if (this.tracks.length === 0) return;
        
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.currentTrackIndex < this.tracks.length - 1) {
            this.nextTrack();
        } else {
            this.pause();
            this.audio.currentTime = 0;
        }
    }
    
    updateActiveTrack() {
        document.querySelectorAll('.track').forEach((track, index) => {
            track.classList.toggle('active', index === this.currentTrackIndex);
        });
    }
    
    updateTrackList() {
        const tracklist = document.querySelector('.tracklist');
        tracklist.innerHTML = '';
        
        if (this.tracks.length === 0) {
            tracklist.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Adicione músicas na lista de faixas no arquivo proibidao-script.js</div>';
            return;
        }
        
        this.tracks.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = `track ${index === this.currentTrackIndex ? 'active' : ''}`;
            trackElement.setAttribute('data-track', index);
            
            trackElement.innerHTML = `
                <span class="track-number">${(index + 1).toString().padStart(2, '0')}</span>
                <span class="track-name">${track.title}</span>
                <span class="track-duration">${track.duration}</span>
            `;
            
            trackElement.addEventListener('click', () => this.selectTrack(index));
            tracklist.appendChild(trackElement);
        });
    }
    
    handleKeyboard(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 10);
                this.setVolume(this.volumeSlider.value);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 10);
                this.setVolume(this.volumeSlider.value);
                break;
        }
    }
    
    setupVisualEffects() {
        // Efeito de partículas no fundo
        this.createParticles();
        
        // Efeito de pulso no CD
        this.animateCD();
        
        // Efeito de brilho no player
        this.animatePlayer();
    }
    
    createParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particles';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        `;
        document.body.appendChild(particleContainer);
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 0, 0, 0.5);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${5 + Math.random() * 10}s linear infinite;
            `;
            particleContainer.appendChild(particle);
        }
        
        // Adicionar CSS para animação das partículas
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    animateCD() {
        const cd = document.querySelector('.cd');
        if (cd) {
            cd.addEventListener('mouseenter', () => {
                cd.style.animationPlayState = 'paused';
            });
            
            cd.addEventListener('mouseleave', () => {
                cd.style.animationPlayState = 'running';
            });
        }
    }
    
    animatePlayer() {
        const player = document.querySelector('.player');
        if (player) {
            setInterval(() => {
                if (this.isPlaying) {
                    player.style.boxShadow = `
                        0 20px 40px rgba(0, 0, 0, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        0 0 30px rgba(255, 0, 0, 0.3)
                    `;
                } else {
                    player.style.boxShadow = `
                        0 20px 40px rgba(0, 0, 0, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `;
                }
            }, 1000);
        }
    }
    
    animatePlayButton() {
        const playBtn = this.playPauseBtn;
        playBtn.style.transform = 'scale(1.1)';
        setTimeout(() => {
            playBtn.style.transform = 'scale(1)';
        }, 200);
    }
    
    animateTrackChange() {
        const trackTitle = this.trackTitle;
        trackTitle.style.opacity = '0';
        trackTitle.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            trackTitle.style.opacity = '1';
            trackTitle.style.transform = 'translateY(0)';
        }, 300);
    }
    
    handleError(e) {
        console.error('Erro no player de áudio:', e);
        this.showNotification('Erro ao carregar a música');
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar o player quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const player = new NeoSonPlayer();
    
    // Adicionar efeito de loading no player
    const trackTitle = document.querySelector('.track-title');
    const loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.style.cssText = `
        font-size: 0.9rem;
        color: #ff0000;
        margin-top: 5px;
        opacity: 1;
        transition: opacity 0.5s ease;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 500;
    `;
    loadingText.textContent = 'Carregando...';
    trackTitle.parentNode.appendChild(loadingText);
    
    // Remover loading após 2 segundos
    setTimeout(() => {
        loadingText.style.opacity = '0';
        setTimeout(() => {
            loadingText.remove();
        }, 500);
    }, 2000);
});

// Adicionar efeitos de hover nos controles
document.addEventListener('DOMContentLoaded', () => {
    const controls = document.querySelectorAll('.control-btn');
    controls.forEach(control => {
        control.addEventListener('mouseenter', () => {
            control.style.transform = 'translateY(-3px) scale(1.1)';
        });
        
        control.addEventListener('mouseleave', () => {
            control.style.transform = 'translateY(0) scale(1)';
        });
    });
});

