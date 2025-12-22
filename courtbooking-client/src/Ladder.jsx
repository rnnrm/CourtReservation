import { useState, useEffect, useActionState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { post } from './Utility.js';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Ladder = ({ user }) => {

    const [matchStatus, setMatchStatus] = useState(null);
    const [score, setScore] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const [opponent, setOpponent] = useState(null);
    const td = new Date();
    const twoWeeksAgo = new Date(td.getYear(), td.getMonth(), td.getDay()-14).toISOString().split('T')[0];
    const today = td.toISOString().split('T')[0];
    const [datePlayed, setDate] = useState(today);
    const [sets, setSets] = useState(1);
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setScore([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        setOpponent(null);
        setShow(false)
    };
    const handleShow = () => { setMatchStatus(null); setShow(true) };
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);
    const [state, action, isPending] = useActionState(logMatch, null);

    const getUsers = async () => {
        let response = await post('api/Users', null, null, "GET");
        if (response.ok)
            setUsers(await response.json());
        else
            setUsers(null);
    }

    useEffect(() => {
        getUsers();
    }, [user]);

    const opponents = users &&
        Object.values(users).filter((v) => v.roles.includes("Member")).sort((a, b) => a.rank - b.rank);

    async function logMatch(prevState, formData) {
        //validate
        if (score[0] === score[1]) { setError("Bad score"); return; }
        if (!opponent) { setError("No opponent selected"); return; }
        let response = await post('api/ladder',
            {
                CompetitionName: "Singles Ladder", Opponent: opponent.id,
                Score: score, DatePlayed: datePlayed
            }, null);

        if (!response.ok) {
            setError("Failed to record result");
            return;
        }
        handleClose();
        getUsers();
        setError("");
        response = await response.json();
        if (response === "Pending")
            setMatchStatus("Result recorded/updated. Awaiting opponent confirmation.");
    };

    return (
        <div className="p-4">
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Record match result</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form action={action}>
                        <Form.Group className="mb-3  align-items-center " >
                            <Row gap={3}>
                                <Col>
                                    <Form.Label>Select opponent</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Select id="opponentSelect"
                                        onChange={e => { setOpponent(opponents[e.target.value]) }}>
                                        <option>Select an opponent</option>
                                        {opponents && opponents.map((_opponent, i) => (_opponent.id !== user?.id ?
                                            (<option key={i} value={i}>{_opponent.name}</option>) : ""))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Form.Group>
                        <Form.Group className="mb-3  align-items-center ">
                            <Row>
                                <Col>
                                    <Form.Label>Date played</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Control
                                        type="date"
                                        value={datePlayed}
                                        min={twoWeeksAgo}
                                        max={today}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Form.Group>
                        <Form.Group className="mb-3 align-items-center" >
                            <Row>
                                <Col>
                                    <Form.Label >Sets played</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Select value={sets} onChange={e => setSets(Number(e.target.value))}>
                                        <option value={1}>One</option>
                                        <option value={2}>Two</option>
                                        <option value={3}>Three</option>
                                        <option value={4}>Four</option>
                                        <option value={5}>Five</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                            <datalist id="setValues">
                                <option value="0"></option>
                                <option value="1"></option>
                                <option value="2"></option>
                                <option value="3"></option>
                                <option value="4"></option>
                                <option value="5"></option>
                                <option value="6"></option>
                                <option value="7"></option>
                            </datalist>
                            {[...Array(sets)].map((x, i) => {
                                return <div key={'sets' + i}>
                                    <Stack direction="horizontal" gap={3}>
                                        <Form.Label className="m-3" >You</Form.Label>
                                        <Form.Control type="number"
                                            onChange={e => setScore(prev => prev.map((v, ii) => ii === i ? e.target.value : v))}
                                            list="setValues" placeholder="0" min="0" step-="1" />
                                        -
                                        <Form.Control type="number"
                                            onChange={e => setScore(prev => prev.map((v, ii) => ii === i + 1 ? e.target.value : v))}
                                            list="setValues" placeholder="0" min="0" step-="1" />
                                        <Form.Label className="m-3" >{opponent?.name ?? 'Select Opponent'}</Form.Label>

                                    </Stack>
                                </div>
                            })
                            }
                        </Form.Group>

                        <div style={{ color: 'red' }}>{state}{error}</div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit"
                        disabled={isPending || !opponent || (score[0] === score[1])}
                        onClick={logMatch}>
                        Submit Match
                    </Button>
                </Modal.Footer>
            </Modal>



            {user?.role === ("Member") &&
                <>
                <p>
                    <Button onClick={handleShow}>Record match result</Button>
                </p>
                <p>
                    {matchStatus}
                </p>
                </>
            }
            <Table striped>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {opponents && opponents?.map((opponent, i) => {
                        return <tr key={opponent.Id + "" + i}>
                            <td>{opponent.rank}</td>
                            <td>{opponent.name}</td>
                        </tr>
                    })
                    }
                </tbody>
            </Table>
            <h2>How it works</h2>
            <ul>
                <li key={2}>Anyone can be challenged</li>
                <li key={3}>No penalty for ignoring a challenge</li>
                <li key={4}>Both opponents must enter the same score for the same day the match is played</li>
                <li key={5}>A player replaces the rank above him if he beats any higher rank</li>
                <li key={6}>Similarly, a player moves down in rank only if they lose to a lower rank</li>
                <li key={7}>The scoring format of the match is decided by the players (default 1 set)</li>
            </ul>

        </div>);

};

export default Ladder;


//Ranks will be frozen until the end of the freeze time (default  1 day), so a higher ranked opponent will keep his position for the purposes of determining your rank movement even if he lost matches before playing you.
//Only one match per opponent per freeze time
//- Rank 1 will decay to rank 5 after 3 months of inactivity to prevent camping