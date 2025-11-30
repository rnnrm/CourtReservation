import { useState, useEffect} from 'react';
import Table from 'react-bootstrap/Table';
//import { Button } from 'bootstrap';
import Button from 'react-bootstrap/Button';
import { post } from './Utility.js';
import Modal from 'react-bootstrap/Modal';

const Ladder = ({ user }) => {


    const [users, setUsers] = useState();

    const getUsers = async () => {
        let response = await post('api/Users', null, null, "GET");
        if (response.ok)
            setUsers(await response.json());
        else
            setUsers(null);
    }

    useEffect(() => {
        //if (user)
            getUsers();
    }, [setUsers, user]);

    const logMatch = async ( winner, loser, datePlayed, result) => {
        let _ = await post('api/ladder',
            {
                CompetitionName: "Singles Ladder", Winner1: winner, Loser1: loser,
                score: result, DatePlayed: datePlayed, ReportedBy: user.Id
            }, null);

    };

    return (
        <>
            <Modal >
                Test
            </Modal>
            <Table striped>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Enter Result</th>
                    </tr>
                </thead>
                <tbody>
                    { users &&
                        Object.entries(users).map(([i, opponent]) => {
                        let isMember = opponent.roles.includes("Member");
                        //let isAdmin = opponent.roles.includes("Admin");
                        if (!(isMember)) return false;
                        return <tr key={opponent.Id}>
                            <td>{opponent.rank}</td>
                            <td>{opponent.name}</td>
                            <td> {user?.role === ("Member") &&
                                <>
                                    <Button onClick={() => logMatch(user.Id, opponent.Id, Date(), 0)}>Win</Button>
                                    <Button onClick={() => logMatch(opponent.Id, user.Id, Date(), 0)}>Lose</Button>
                                </>
                                }
                            </td>
                            </tr>
                        })
                    }
                </tbody>
            </Table>
            <h2>How it works</h2>
                <ul>
                <li key={1}>Select a player to enter a result</li>
                <li key={2}>Anyone can be challenged</li>
                <li key={3}>No penalty for ignoring a challenge</li>
                <li key={4}>Both opponents must enter the same score on the same day the match is played</li>
                <li key={5}>A player replaces the rank above him if he beats any higher rank</li>
                <li key={6}>Similarly, a player moves down in rank only if they lose to a lower rank</li>
                <li key={7}>The scoring format of the match is decided by the players (default 1 set)</li>
                </ul>


            
        </>);

};

export default Ladder;


                //Ranks will be frozen until the end of the freeze time (default  1 day), so a higher ranked opponent will keep his position for the purposes of determining your rank movement even if he lost matches before playing you.
                //Only one match per opponent per freeze time
                //- Rank 1 will decay to rank 5 after 3 months of inactivity to prevent camping