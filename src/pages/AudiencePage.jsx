import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../supabase";


const AudiencePage = () => {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [voteValue, setVoteValue] = useState(5);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("participants")
          .select("*, votes(score)");
        if (error) throw error;

        const formattedData = data.map((p) => ({
          id: p.id,
          name: p.name,
          eventName: p.event_name,
          photoUrl: p.photo_url,
          startTime: new Date(p.start_time),
          endTime: new Date(p.end_time),
          score: p.votes?.length ? p.votes.reduce((acc, v) => acc + v.score, 0) / p.votes.length : 0,
        }));

        setParticipants(formattedData);
      } catch (error) {
        toast.error("Error fetching participants: " + error, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  const handleVote = (participant) => {
    if (new Date() > participant.endTime) return;
    setSelectedParticipant(participant);
    setVoteDialogOpen(true);
  };

  const submitVote = async () => {
    if (!selectedParticipant) return;

    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const { ip } = await response.json();

      const { data: existingVotes, error: existingVoteError } = await supabase
        .from("votes")
        .select("id")
        .eq("participant_id", selectedParticipant.id)
        .eq("ip_address", ip);

      if (existingVoteError) throw existingVoteError;

      if (existingVotes?.length) {
        await supabase.from("votes").update({ score: voteValue }).eq("id", existingVotes[0].id);
      } else {
        await supabase
          .from("votes")
          .insert({ participant_id: selectedParticipant.id, ip_address: ip, score: voteValue });
      }

      toast.success("Vote submitted successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      setVoteDialogOpen(false);
      setSelectedParticipant(null);
      setVoteValue(5);
    } catch (error) {
      toast.error("Error submitting vote: " + error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Vote for Your Favorite</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[300px] rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {participants.map((participant) => {
            const isVotingActive = new Date() <= participant.endTime;

            return (
              <div
                key={participant.id}
                className="border rounded-lg shadow-md p-4 flex flex-col items-center text-center"
              >
                {participant.photoUrl && (
                  <img
                    src={participant.photoUrl}
                    alt={participant.name}
                    className="w-full h-64 object-cover rounded-md mb-3"
                  />
                )}
                <h2 className="text-lg font-semibold">{participant.name}</h2>
                <p className="text-sm text-gray-500">{participant.eventName}</p>
                <div className="text-xs text-gray-400 mt-2">
                  📅 {participant.startTime.toLocaleString()} - {participant.endTime.toLocaleString()}
                </div>
                <button
                  className={`mt-3 px-4 py-2 w-full text-white rounded-md ${
                    isVotingActive ? "bg-purple-500 hover:bg-purple-600" : "bg-gray-300 cursor-not-allowed"
                  }`}
                  onClick={() => handleVote(participant)}
                  disabled={!isVotingActive}
                >
                  {isVotingActive ? "Vote Now" : "Voting Ended"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {voteDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold text-center">Vote for {selectedParticipant?.name}</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium">Score (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={voteValue}
                onChange={(e) => setVoteValue(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="text-center text-2xl font-bold mt-2">{voteValue}</div>
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="px-4 py-2 bg-gray-300 text-black rounded-md"
                onClick={() => setVoteDialogOpen(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md" onClick={submitVote}>
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudiencePage;
