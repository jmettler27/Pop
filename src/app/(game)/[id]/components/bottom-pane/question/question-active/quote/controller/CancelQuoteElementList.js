import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import CommentIcon from '@mui/icons-material/Comment';
import { prependQuoteElementWithEmoji } from '@/lib/utils/question/quote';

export default function CancelQuoteElementList({ toGuess }) {
    const [checked, setChecked] = React.useState([0]);

    const handleToggle = (value) => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    return (
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {toGuess.map((quoteElem) => {
                const labelId = `checkbox-list-label-${quoteElem}`;

                return (
                    <ListItem
                        key={quoteElem}
                        // secondaryAction={
                        //     <IconButton edge="end" aria-label="comments">
                        //         <CommentIcon />
                        //     </IconButton>
                        // }
                        disablePadding
                    >
                        <ListItemButton role={undefined} onClick={handleToggle(quoteElem)} dense>
                            <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    checked={checked.indexOf(quoteElem) !== -1}
                                    tabIndex={-1}
                                    disableRipple
                                    inputProps={{ 'aria-labelledby': labelId }}
                                />
                            </ListItemIcon>
                            <ListItemText id={labelId} primary={prependQuoteElementWithEmoji(quoteElem)} />
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
}