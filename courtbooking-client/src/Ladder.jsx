import { useState, useEffect } from 'react';
import Table from 'react-bootstrap/Table';
import { post } from './Utility.js';
import { useParams } from "react-router-dom";
import MatchReport from './MatchReport.jsx';

const Ladder = ({ user }) => {
    const { competitionName } = useParams();
    const [matchResults, setMatchResults] = useState(null);
    const [pendingResults, setPendingResults] = useState(null);
    const [competitors, setCompetitors] = useState(null);   
    const [adjectives, setAdjectives] = useState(["vaporized", "terminated", "crushed", "obliterated", "destroyed", "demolished", "annihilated", "decimated"]);
    let rank = 1;

    const getCompetitors = async () => {
        let response = await post('/api/Ladder/Competitors?competitionName=' + encodeURIComponent(competitionName), null, null, "GET");
        if (response.ok)
            setCompetitors(await response.json());
        else
            setCompetitors(null);
    }

    const getMatchResults = async () => {
        let response = await post('/api/Ladder/Results?competitionName=' + encodeURIComponent(competitionName), null, null, "GET");
        if (response.ok)
            setMatchResults(await response.json());
        else
            setMatchResults(null);
    };

    const getPendingResults = async () => {
        let response = await post('/api/Ladder/PendingResults?competitionName=' + encodeURIComponent(competitionName), null, null, "GET");
        if (response.ok)
            setPendingResults(await response.json());
        else
            setPendingResults(null);
    };

    const initialize = () => {
        getCompetitors();
        getMatchResults();
        getPendingResults();
    }

    useEffect(() => {
        getCompetitors();
        getMatchResults();
        getPendingResults();
    }, [user, competitionName]);

    useEffect(() => {

        const arr = [...adjectives]; // copy to avoid mutating state directly
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // random index
            [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
        }
        setAdjectives(arr)
    }, [])

    return (
        <div className="p-4">
            {user?.role === ("Member") &&
                <MatchReport user={user} updateDisplay={initialize} />}

            <Table striped>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {competitors && competitors?.map((c, i) => {
                        if (i > 0) { 
                            if (competitors[i - 1].rating < c.rating)
                                rank++;
                        }
                        return <tr key={c.Id + "" + i}>
                            <td>{rank}</td>
                            <td>{c.players[0].userName} {c.type === "doubles" ? " / " + c.players[1]?.userName : null}</td>
                            <td>{c.rating}</td>
                        </tr>
                    })
                    }
                </tbody>
            </Table>
            {matchResults?.length>0 &&
                <>
                    <h3 className="mt-3">Latest results</h3>
                <div style={{maxHeight:"200px",overflowY:"auto"}}>
                    {matchResults.map((result, i) => (
                        <div key={i}>
                            {result.winner1} {result.winner2 ? ' & '+result.winner2 :""}<sup style={{ color: "lightgreen" }} >+{result.pointsChange}</sup> <i>{adjectives[i]} </i>
                            {result.loser1} {result.loser2 ? ' & ' + result.loser2 : ""}<sup style={{ color: "red" }} >-{result.pointsChange} </sup>
                            <br/><b> {result.score} </b> on {result.datePlayed}
                        </div>
                    ))}
                </div>
                </>
            }
            {pendingResults?.length > 0 &&
                <>
                <h5 className="mt-3">Results awaiting confirmation:</h5>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {pendingResults.map((result, i) => (
                        <div key={i}>
                            {result.winner1} {result.winner2 ? ' & ' + result.winner2 : ""} vs {result.loser1} {result.loser2 ? ' & ' + result.loser2 : ""}
                            <br /><b> {result.score} </b> on {result.datePlayed} reported by {result.reportedBy}
                        </div>
                    )) 
                    }
                    </div>
                </>
            }

        </div>);
};

export default Ladder;


/*<br/>
<h2>How it works</h2>
<ul>
    <li key={2}>Anyone can be challenged</li>
    <li key={3}>No penalty for ignoring a challenge</li>
    <li key={4}>Both opponents must enter the same score for the same day the match is played</li>
    <li key={7}>The scoring format of the match is decided by the players (default 1 set)</li>
    <li key={5}>A player replaces the rank above him if he beats any higher rank</li>
    <li key={6}>Similarly, a player moves down in rank only if they lose to a lower rank</li>
</ul>
Ranks will be frozen until the end of the freeze time (default  1 day), so a higher ranked opponent will keep his position for the purposes of determining your rank movement even if he lost matches before playing you.
Only one match per opponent per freeze time
- Rank 1 will decay to rank 5 after 3 months of inactivity to prevent camping*/