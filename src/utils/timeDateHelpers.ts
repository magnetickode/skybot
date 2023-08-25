import { intervalToDuration } from 'date-fns';

export const getFormattedDuration = (timeInMilliseconds: number) => {
  const { hours, minutes, seconds } = intervalToDuration({
    start: 0,
    end: timeInMilliseconds,
  });

  const secondsFormatted = seconds < 10 ? '0' + seconds : seconds.toString();

  let formattedDuration = '';

  if (hours) {
    formattedDuration = `${hours}:${minutes}:${secondsFormatted}`;
  } else if (minutes) {
    formattedDuration = `${minutes}:${secondsFormatted}`;
  } else {
    formattedDuration = `00:${secondsFormatted}`;
  }

  return formattedDuration;
};
