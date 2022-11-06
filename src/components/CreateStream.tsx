import React from 'react';

import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { StreamClient, getBN, Cluster } from '@streamflow/stream';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

interface availableTokens {
  mint: string;
  isNative: boolean;
  amount: number;
  decimals: number;
  uiAmount: string;
}
const CreateStream = () => {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [tx, setTx] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [recipient, setRecipient] = React.useState("");
  const [streamName, setStreamName] = React.useState("");
  const [availableTokens, setAvailableTokens] = React.useState<availableTokens[]>([]);
  const [selectedToken, setSelectedToken] = React.useState<availableTokens>();


  const getTokenAccounts = async () => {
    const solanaConnection = new Connection("https://api.devnet.solana.com");
    const response = await solanaConnection.getParsedTokenAccountsByOwner(
       // @ts-ignore
       wallet.publicKey,
       { programId: TOKEN_PROGRAM_ID },
    );
    const result: availableTokens[] = [];
    response.value.forEach(value => {
      const mint = value.account.data.parsed.info.mint;
      const isNative = value.account.data.parsed.info.isNative;
      const amount = value.account.data.parsed.info.tokenAmount.uiAmount;
      const uiAmount = value.account.data.parsed.info.tokenAmount.uiAmountString;
      const decimals = value.account.data.parsed.info.tokenAmount.decimals;
      if (amount > 0) {
        result.push({ mint, amount, uiAmount, decimals, isNative });
      }
    });
    setAvailableTokens(result);
   };

   const onTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedToken = availableTokens.find(token => token.mint === event.target.value);
      setSelectedToken(selectedToken);
   };

   const createStream = async () => {
    const client = new StreamClient(
      "https://api.devnet.solana.com",
      Cluster.Devnet
    );
    const mint = selectedToken?.mint;
    const depositedAmount = getBN(Number(amount), selectedToken?.decimals || 0);
    const createStreamParams = {
      sender: anchorWallet, // Wallet/Keypair signing the transaction, creating and sending the stream.
      recipient, // Solana recipient address.
      mint, // SPL Token mint.
      start: Math.ceil(Date.now()/1000) + 300, // Timestamp (in seconds) when the stream/token vesting starts.
      depositedAmount, // depositing 100 tokens with 9 decimals mint.
      period: 60, // Time step (period) in seconds per which the unlocking occurs.
      cliff: 0, // Vesting contract "cliff" timestamp in seconds.
      cliffAmount: getBN(0, 9), // Amount unlocked at the "cliff" timestamp.
      amountPerPeriod: getBN(Number(amount) / 10, selectedToken?.decimals || 0), // Release rate: how many tokens are unlocked per each period.
      name: streamName, // The stream name or subject.
      canTopup: false, // setting to FALSE will effectively create a vesting contract.
      cancelableBySender: true, // Whether or not sender can cancel the stream.
      cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
      transferableBySender: true, // Whether or not sender can transfer the stream.
      transferableByRecipient: false, // Whether or not recipient can transfer the stream.
      automaticWithdrawal: false, // Whether or not a 3rd party (e.g. cron job, "cranker") can initiate a token withdraw/transfer.
      withdrawalFrequency: 10,
      isNative: selectedToken?.isNative, // Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
      partner: null, //  (optional) Partner's wallet address (string | null).
    };
    try {
      setLoading(true);
      // @ts-ignore
      const { ixs, tx, metadata } = await client.create(createStreamParams);
      setLoading(false);
      console.log("ixs", ixs);
      console.log("tx", tx);
      console.log("metadata", metadata);
      setTx(tx);
      setAvailableTokens([]);
      setAmount("");
      setRecipient("");
      setStreamName("");
    } catch (exception) {
      // handle exception
      console.log("exception", exception);
    }
  };

  React.useEffect(() => {
    if (wallet.connected) {
      getTokenAccounts();
    }
  }, [wallet.connected]);

  React.useEffect(() => {
    return () => {
      setTx("");
    }
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" component="div">
          Create a stream
        </Typography>
      </Grid>
      {!wallet?.connected && (
        <Grid item>
          <Typography variant="body1" component="div">
            Connect your wallet to create a stream
          </Typography>
        </Grid>
      )}
      {wallet?.connected && (
        <>
          <Grid item xs={4}>
            <TextField select value={selectedToken?.mint} onChange={onTokenChange} fullWidth label="Select token">
              {availableTokens.map((token) => (
                <MenuItem key={token.mint} value={token.mint}>
                  {token.mint} - {token.uiAmount}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Stream Name"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={createStream}
                disabled={loading}
              >
                {loading ? 'Creating stream...' : 'Create Stream' }
              </Button>
              {!loading && tx && (
                <Typography variant="body1" component="div">
                  Stream txn id : {tx}
                </Typography>
              )}
            </>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default CreateStream;