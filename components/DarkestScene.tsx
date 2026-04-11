import React from 'react';

interface DarkestSceneProps {
  onReady?: () => void;
}

const DARKEST_CLONE_SRC = `${import.meta.env.BASE_URL}darkest_clone/index.html`;

const DarkestScene: React.FC<DarkestSceneProps> = ({ onReady }) => {
  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        title="Darkest Clone"
        src={DARKEST_CLONE_SRC}
        className="h-full w-full border-0 bg-black"
        onLoad={onReady}
      />
    </div>
  );
};

export default DarkestScene;
