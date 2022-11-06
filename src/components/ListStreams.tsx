import react from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { StreamClient, Cluster, Stream } from "@streamflow/stream";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

interface UserStreams {
  stream: Stream;
  id: string;

}

const ListStreams = () => {
  const [streams, setStreams] = react.useState<UserStreams[]>([]);
  const [loading, setLoading] = react.useState(false);
  const [error, setError] = react.useState(null);

  let interval: any;
  const wallet = useWallet();

  const getStreams = async (publicKey: PublicKey) => {
    setLoading(true);
    const client = new StreamClient(
      "https://api.devnet.solana.com",
      Cluster.Devnet,
      "confirmed"
    );
    const streams = await client.get({ wallet: publicKey });
    const result: UserStreams[] = [];
    streams.forEach(value => {
      const id = value[0];
      const stream = value[1] as Stream;
      result.push({ id, stream });
    })
    setStreams(result);
    console.log("streams", streams);
    setLoading(false);
  };

  react.useEffect(() => {
    if (wallet.connected) {
      // @ts-ignore
      getStreams(wallet.publicKey);
      // @ts-ignore
      interval = setInterval(() => getStreams(wallet.publicKey), 30000);
    } else if (interval) {
      clearInterval(interval);
    }
  }, [wallet.connected]);

  return (
    <Grid container spacing={2} mt={2} px={1}>
      <Grid item xs={12}>
        <Typography variant="h4" component="div">
          Your streams
        </Typography>
      </Grid>
      {loading && (
        <Grid item xs={12} justifyContent="center" alignItems="center">
          <Typography variant="body1" component="div">
            Loading...
          </Typography>
        </Grid>
      )}
      {!wallet?.connected && (
        <Grid item xs={12} justifyContent="center" alignItems="center">
          <Typography>Connect your wallet to see your streams</Typography>
        </Grid>
      )}
      {wallet?.connected && !loading && (
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Stream ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mint</TableCell>
                  <TableCell>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {streams.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.id}
                    </TableCell>
                    <TableCell>{row.stream.name || '-'}</TableCell>
                    <TableCell>{row.stream.mint}</TableCell>
                    <TableCell>{row.stream.depositedAmount.toNumber()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      )}
    </Grid>
  );
}

export default ListStreams;