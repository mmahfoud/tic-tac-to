import { useEffect, useState } from 'react';
import './App.css';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// usefull functions
// _: for a value s, and function or value f: it applies f to s and returns the result if f is a function,
//    or returns f it self if it is not a function.
const _ = (s: any) => (f: (x: any) => any | any) =>
  typeof f === 'function' ? f(s) : f;

// $$: for a set funtion, and a string n, and a value v, it applies the set function
//     on an arraw functions that takes a state and returns the property n of it,
//     if this property is a function, it applies it on the value v, if not, v is returned
const $$ = (set: (state: any) => any) => (n: string) => (v: any) =>
  set((state: any) => ({
    [n]: _(state[n])(v),
  }));

// Player is either X or O
type Player = 'X' | 'O';
// A move is either made by a player, or not yet
type Move = Player | null;
// A winner is one of the players if there is a winner
type Winner = Player | null;
// The game state is a list of moves
type GameState = Move[];
// The history is a list of game states
type History = GameState[];

type Mode = 'light' | 'dark';

// this uses zustand to create a store that hols the game history
const useGameStore = create(
  combine(
    {
      history: [Array(9).fill(null)] as History,
      currentMove: 0,
    },
    (set) => ({
      setHistory: $$(set)('history') as (x: History) => void,
      setCurrentMove: $$(set)('currentMove') as (i: number) => void,
    })
  )
);

function Square({
  index,
  value,
  onSquareClick,
}: {
  index: number;
  value: Move;
  onSquareClick: () => void;
}) {
  let classes = 'cell';
  if (index % 3 == 2) classes += ' cell-right';
  if (index / 3 >= 2) classes += ' cell-bottom';
  return (
    <button
      className={classes}
      onClick={onSquareClick}
      onFocus={(e) => e.target.blur()}
      style={{ fontSize: '3em' }}
    >
      {value}
    </button>
  );
}

function Board({
  xIsNext,
  squares,
  onPlay,
}: {
  xIsNext: boolean;
  squares: GameState;
  onPlay: (s: GameState) => void;
}) {
  const winner = calculateWinner(squares);
  const turns = calculateTurns(squares);
  const player: Player = xIsNext ? 'X' : 'O';
  const status = calculateStatus(winner, turns, player);

  function handleClick(i: number) {
    if (squares[i] || winner) return;
    const nextSquares = squares.slice(); // copy the squares array
    nextSquares[i] = player; // modify the current square clicked with the current player value
    onPlay(nextSquares); // call onPlay
  }

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(6 * 2.5rem)',
          height: 'calc(6 * 2.5rem)',
        }}
      >
        {squares.map((_, i) => (
          <Square
            key={`square-${i}`}
            index={i}
            value={squares[i]}
            onSquareClick={() => handleClick(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default function GameApp() {
  // currently chosen mode (theme)
  const [mode, setMode] = useState(
    localStorage.mode ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : ('light' as Mode))
  );

  const { history, setHistory, currentMove, setCurrentMove } = useGameStore();

  useEffect(() => {
    // apply the new mode (theme)
    document.documentElement.style.setProperty('color-scheme', mode);
    // save it for later
    localStorage.mode = mode;
  }, [mode]);

  function handlePlay(nextSquares: GameState) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
  }

  return (
    <>
      <div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
          }}
        >
          <button
            onClick={() => {
              const m = mode == 'light' ? 'dark' : 'light';
              setMode(m);
            }}
          >
            Switch to {mode == 'light' ? 'dark' : 'light'}
          </button>
        </div>
        <div>
          <hr />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          fontFamily: 'monospace',
        }}
      >
        <div>
          <Board
            xIsNext={currentMove % 2 == 1}
            squares={history[currentMove]}
            onPlay={handlePlay}
          />
        </div>
        <div style={{ marginLeft: '1rem' }}>
          <ol>
            {history.map((_, historyIndex) => {
              const description =
                historyIndex > 0
                  ? `Go to move #${historyIndex}`
                  : 'Go to game start';

              return (
                <li key={historyIndex}>
                  <a onClick={() => jumpTo(historyIndex)}>{description}</a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </>
  );
}

function calculateWinner(squares: GameState): Winner {
  const lines = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left column
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // main diagonal
    [2, 4, 6], // reverse diagonal
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a] as Winner;
    }
  }

  return null;
}

function calculateTurns(squares: GameState): number {
  return squares.filter((square) => !square).length;
}

function calculateStatus(
  winner: Winner,
  turns: number,
  player: Player
): string {
  if (!winner && !turns) return `Draw`;
  if (winner) return `Winner ${winner}`;
  return `Next player: ${player}`;
}
