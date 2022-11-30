const cont = document.getElementById('cont');
const text = document.getElementById('text');

const totalTime = 7500;
const breatheTime = (totalTime / 5) * 2;
const holdTime = totalTime / 5;

breathAnimation();

function breathAnimation() {
  text.innerText = 'Breathe In!';
  cont.className = 'cont grow';

  setTimeout(() => {
    text.innerText = 'Hold';

    setTimeout(() => {

      text.innerText = 'Breathe Out!';
      cont.className = 'cont shrink';
    }, holdTime);
  }, breatheTime);
}

setInterval(breathAnimation, totalTime);